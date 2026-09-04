import React,{useEffect,useMemo,useState} from 'react'
import {Archive,BookOpen,CheckCircle2,CheckSquare,ExternalLink,File,FolderOpen,Image,RefreshCw,ScanText,Search,Target} from 'lucide-react'
import {supabase} from './supabase.js'
import {chunkKnowledge,suggestKnowledgeClassification,topicLabel,topicsForUnit,unitLabel,unitsForSubject} from './libraryKnowledge.js'
import AskLibraryPanel from './AskLibraryPanel.jsx'
import './phase4-library.css'

const PURPOSES={
  learn:{label:'Learn',icon:BookOpen,help:'Material Kellyn wants to understand, revise and use for future study.'},
  do:{label:'Do',icon:CheckSquare,help:'Schoolwork or instructions that have also been turned into My Work.'},
  improve:{label:'Improve',icon:Target,help:'Teacher feedback or marked work that should influence future practice.'},
  keep:{label:'Keep',icon:Archive,help:'Useful reference material that should stay searchable and easy to find.'}
}

const ITEM_FIELDS='id,user_id,capture_id,subject_slug,unit_slug,topic_slug,title,purpose,resource_type,source_url,summary,tags,linked_task_id,status,created_at,updated_at,extraction_status,extraction_method,extracted_at,classification_status,suggested_subject_slug,suggested_unit_slug,suggested_topic_slug,source_page_count,extraction_note'

function sourceFrom(item){return item.source_url||''}
function clean(value=''){return String(value||'').replace(/\s+/g,' ').trim()}
function extractionLabel(item){
  if(item.extraction_status==='ready')return'Ready for study'
  if(item.extraction_status==='needs_review')return'Check filing'
  if(item.extraction_status==='processing')return'Reading…'
  if(item.extraction_status==='failed')return'Read failed'
  return'Original saved'
}

export default function Phase4Library({session,subjects=[],files=[],notify,go}){
  const [items,setItems]=useState([])
  const [targets,setTargets]=useState([])
  const [query,setQuery]=useState('')
  const [purpose,setPurpose]=useState('all')
  const [subject,setSubject]=useState('all')
  const [opening,setOpening]=useState(null)
  const [loading,setLoading]=useState(true)
  const [extracting,setExtracting]=useState(null)
  const [progress,setProgress]=useState('')
  const [reviewing,setReviewing]=useState(null)
  const [reviewText,setReviewText]=useState('')
  const [draft,setDraft]=useState({subject_slug:'',unit_slug:'',topic_slug:''})
  const [searchMatches,setSearchMatches]=useState({})
  const [searching,setSearching]=useState(false)

  useEffect(()=>{load()},[session?.user?.id])
  useEffect(()=>{
    const q=clean(query)
    if(!session?.user?.id||q.length<2){setSearchMatches({});setSearching(false);return}
    let cancelled=false
    const timer=setTimeout(async()=>{
      setSearching(true)
      let {data,error}=await supabase.from('library_chunks').select('library_item_id,content').eq('user_id',session.user.id).textSearch('content',q,{type:'websearch',config:'english'}).limit(100)
      if(error){
        const safe=q.replace(/[%_]/g,'')
        const fallback=await supabase.from('library_chunks').select('library_item_id,content').eq('user_id',session.user.id).ilike('content',`%${safe}%`).limit(100)
        data=fallback.data;error=fallback.error
      }
      if(cancelled)return
      if(error)notify?.(error.message)
      const matches={}
      for(const row of data||[])if(!matches[row.library_item_id])matches[row.library_item_id]=clean(row.content).slice(0,420)
      setSearchMatches(matches);setSearching(false)
    },250)
    return()=>{cancelled=true;clearTimeout(timer)}
  },[query,session?.user?.id])

  async function load(){
    if(!session?.user?.id)return
    setLoading(true)
    const uid=session.user.id
    const [{data:library,error:libraryError},{data:feedback,error:feedbackError}]=await Promise.all([
      supabase.from('library_items').select(ITEM_FIELDS).eq('user_id',uid).eq('status','active').order('created_at',{ascending:false}),
      supabase.from('feedback_targets').select('*').eq('user_id',uid).eq('status','active').order('created_at',{ascending:false})
    ])
    if(libraryError)notify?.(libraryError.message)
    if(feedbackError)notify?.(feedbackError.message)
    setItems(library||[]);setTargets(feedback||[]);setLoading(false)
  }

  async function openFile(file){
    if(!file?.storage_path)return
    setOpening(file.id||file.storage_path)
    const preview=window.open('about:blank','_blank')
    if(preview){preview.opener=null;preview.document.title='Opening resource…'}
    const {data,error}=await supabase.storage.from('user-files').createSignedUrl(file.storage_path,600)
    setOpening(null)
    if(error||!data?.signedUrl){if(preview)preview.close();return notify?.(error?.message||'Could not open this resource.')}
    if(preview)preview.location.replace(data.signedUrl)
    else window.open(data.signedUrl,'_blank','noopener,noreferrer')
  }

  async function archive(item){
    if(!confirm('Archive this library item? The original capture and file will be kept.'))return
    const {error}=await supabase.from('library_items').update({status:'archived'}).eq('id',item.id).eq('user_id',session.user.id)
    if(error)return notify?.(error.message)
    setItems(current=>current.filter(x=>x.id!==item.id));notify?.('Library item archived.')
  }

  async function readResource(item,attached){
    if(extracting)return
    if(!attached.length)return notify?.('There is no attached screenshot or file to read. Text captured directly is already searchable.')
    setExtracting(item.id);setProgress('Preparing resource…')
    await supabase.from('library_items').update({extraction_status:'processing',extraction_note:null}).eq('id',item.id).eq('user_id',session.user.id)
    setItems(current=>current.map(x=>x.id===item.id?{...x,extraction_status:'processing'}:x))
    try{
      const {extractFileText}=await import('./libraryExtraction.js')
      const parts=[],methods=[],notes=[]
      let pages=0,supported=0
      for(let index=0;index<attached.length;index++){
        const stored=attached[index]
        setProgress(`Opening ${stored.original_name}…`)
        const {data:blob,error:downloadError}=await supabase.storage.from('user-files').download(stored.storage_path)
        if(downloadError){notes.push(`${stored.original_name}: ${downloadError.message}`);continue}
        const browserFile=new File([blob],stored.original_name,{type:stored.mime_type||blob.type||'application/octet-stream'})
        try{
          const result=await extractFileText(browserFile,p=>setProgress(attached.length>1?`${index+1}/${attached.length} · ${p.label}`:p.label))
          supported++
          if(result.text)parts.push(`SOURCE: ${stored.original_name}\n${result.text}`)
          if(result.method)methods.push(result.method)
          if(result.pageCount)pages+=result.pageCount
          if(result.note)notes.push(result.note)
        }catch(error){notes.push(`${stored.original_name}: ${error.message}`)}
      }
      const text=parts.join('\n\n').trim()
      if(!text){
        const note=notes.join(' ')||'No readable text was found.'
        await supabase.from('library_items').update({extraction_status:'failed',extraction_note:note}).eq('id',item.id).eq('user_id',session.user.id)
        setItems(current=>current.map(x=>x.id===item.id?{...x,extraction_status:'failed',extraction_note:note}:x))
        notify?.(supported?'No readable text was found in this resource.':'This file type cannot be read automatically yet.')
        return
      }
      setProgress('Organising the extracted text…')
      const suggestion=suggestKnowledgeClassification(text,item.title,item.subject_slug)
      const chunks=chunkKnowledge(text)
      const update={
        extracted_text:text,
        summary:clean(text).slice(0,650),
        extraction_status:'needs_review',
        extraction_method:[...new Set(methods)].join('+')||'text',
        extracted_at:new Date().toISOString(),
        suggested_subject_slug:suggestion.subject_slug,
        suggested_unit_slug:suggestion.unit_slug,
        suggested_topic_slug:suggestion.topic_slug,
        tags:[...new Set([...(item.tags||[]),...suggestion.tags])],
        source_page_count:pages||null,
        extraction_note:notes.join(' ')||null,
        classification_status:'suggested'
      }
      const {data:updated,error:updateError}=await supabase.from('library_items').update(update).eq('id',item.id).eq('user_id',session.user.id).select(ITEM_FIELDS).single()
      if(updateError)throw updateError
      await supabase.from('library_chunks').delete().eq('user_id',session.user.id).eq('library_item_id',item.id)
      const rows=chunks.map((content,index)=>({user_id:session.user.id,library_item_id:item.id,chunk_index:index,content,source_label:item.title}))
      for(let i=0;i<rows.length;i+=100){
        const {error}=await supabase.from('library_chunks').insert(rows.slice(i,i+100))
        if(error)throw error
      }
      setItems(current=>current.map(x=>x.id===item.id?updated:x))
      notify?.('Text extracted. Check the suggested filing before using it for study.')
      await startReview(updated,text)
    }catch(error){
      await supabase.from('library_items').update({extraction_status:'failed',extraction_note:error.message}).eq('id',item.id).eq('user_id',session.user.id)
      setItems(current=>current.map(x=>x.id===item.id?{...x,extraction_status:'failed',extraction_note:error.message}:x))
      notify?.(`Could not read this resource: ${error.message}`)
    }finally{setExtracting(null);setProgress('')}
  }

  async function startReview(item,knownText=null){
    let text=knownText
    if(text===null){
      const {data,error}=await supabase.from('library_items').select('extracted_text').eq('id',item.id).eq('user_id',session.user.id).maybeSingle()
      if(error)return notify?.(error.message)
      text=data?.extracted_text||''
    }
    const suggestion=suggestKnowledgeClassification(text,item.title,item.subject_slug||item.suggested_subject_slug)
    const subjectSlug=item.subject_slug||item.suggested_subject_slug||suggestion.subject_slug||''
    const unitSlug=item.unit_slug||item.suggested_unit_slug||suggestion.unit_slug||''
    const topicSlug=item.topic_slug||item.suggested_topic_slug||suggestion.topic_slug||''
    setReviewText(text);setDraft({subject_slug:subjectSlug,unit_slug:unitSlug,topic_slug:topicSlug});setReviewing(item.id)
  }

  async function confirmFiling(item){
    const update={subject_slug:draft.subject_slug||null,unit_slug:draft.unit_slug||null,topic_slug:draft.topic_slug||null,classification_status:'confirmed',extraction_status:'ready'}
    const {data,error}=await supabase.from('library_items').update(update).eq('id',item.id).eq('user_id',session.user.id).select(ITEM_FIELDS).single()
    if(error)return notify?.(error.message)
    if(item.capture_id){
      await Promise.all([
        supabase.from('quick_capture').update({subject_slug:update.subject_slug}).eq('id',item.capture_id).eq('user_id',session.user.id),
        supabase.from('user_files').update({subject_slug:update.subject_slug}).eq('capture_id',item.capture_id).eq('user_id',session.user.id)
      ])
    }
    if(item.linked_task_id)await supabase.from('tasks').update({subject_slug:update.subject_slug}).eq('id',item.linked_task_id).eq('user_id',session.user.id)
    setItems(current=>current.map(x=>x.id===item.id?data:x));setReviewing(null);setReviewText('');notify?.('Filed and ready to use for study.')
  }

  const counts=useMemo(()=>Object.fromEntries(Object.keys(PURPOSES).map(key=>[key,items.filter(x=>x.purpose===key).length])),[items])
  const filtered=useMemo(()=>{
    const q=clean(query).toLowerCase()
    return items.filter(item=>{
      if(purpose!=='all'&&item.purpose!==purpose)return false
      if(subject!=='all'&&item.subject_slug!==subject)return false
      if(!q)return true
      const metadata=[item.title,item.summary,item.subject_slug,item.unit_slug,item.topic_slug,...(item.tags||[])].some(value=>clean(value).toLowerCase().includes(q))
      return metadata||Boolean(searchMatches[item.id])
    })
  },[items,query,purpose,subject,searchMatches])

  return <div className="library-shell">
    <section className="library-hero">
      <div><span>Kellyn's Learning Library</span><h2>Everything useful, connected back to the original.</h2><p>Teacher handouts, screenshots, web pages, PDFs, notes, tasks and feedback can live here instead of disappearing into a capture list. Read saved resources, check where they belong, then search the knowledge inside them.</p></div>
      <button onClick={()=>go?.('capture')}><FolderOpen/> Add or process captures</button>
    </section>

    <AskLibraryPanel session={session} subjects={subjects} files={files} notify={notify}/>

    <section className="library-purpose-grid">{Object.entries(PURPOSES).map(([key,meta])=>{const Icon=meta.icon;return <button key={key} className={purpose===key?'active':''} onClick={()=>setPurpose(purpose===key?'all':key)}><Icon/><span><strong>{meta.label}</strong><small>{meta.help}</small></span><b>{counts[key]||0}</b></button>})}</section>

    <section className="library-tools">
      <label className="library-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles and the text inside saved resources"/>{searching&&<RefreshCw className="library-search-spin"/>}</label>
      <select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">All subjects</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select>
      {(purpose!=='all'||subject!=='all'||query)&&<button onClick={()=>{setPurpose('all');setSubject('all');setQuery('')}}>Clear filters</button>}
    </section>

    {targets.length>0&&<section className="library-targets"><div className="library-section-title"><Target/><div><h3>Active teacher feedback</h3><p>Targets captured from marked work or teacher comments.</p></div></div>{targets.slice(0,4).map(t=><article key={t.id}><strong>{t.title}</strong><span>{t.subject_slug||'General'}</span><p>{t.target}</p></article>)}</section>}

    <section className="library-results">
      <div className="library-results-head"><div><h3>{purpose==='all'?'My Library':PURPOSES[purpose].label}</h3><p>{filtered.length} item{filtered.length===1?'':'s'} shown</p></div><small>Resources marked Ready for study have searchable text and confirmed filing.</small></div>
      {loading&&<div className="library-empty">Loading library…</div>}
      {!loading&&filtered.length===0&&<div className="library-empty"><FolderOpen/><strong>No matching library items yet.</strong><span>Process a capture as Learn, Do, Improve or Keep to add it here.</span></div>}
      <div className="library-list">{filtered.map(item=>{
        const meta=PURPOSES[item.purpose]||PURPOSES.keep,Icon=meta.icon
        const attached=files.filter(f=>f.capture_id===item.capture_id)
        const target=targets.find(t=>t.library_item_id===item.id)
        const isExtracting=extracting===item.id
        const canRead=attached.some(file=>(file.mime_type||'').startsWith('image/')||file.mime_type==='application/pdf'||/\.(pdf|png|jpe?g|webp|txt|md|csv)$/i.test(file.original_name||''))
        const reviewOpen=reviewing===item.id
        const unitName=unitLabel(item.subject_slug,item.unit_slug)
        const topicName=topicLabel(item.subject_slug,item.unit_slug,item.topic_slug)
        return <article className="library-card" key={item.id}>
          <div className={`library-purpose purpose-${item.purpose}`}><Icon/><span>{meta.label}</span></div>
          <div className="library-card-main">
            <div className="library-title-row"><div><h4>{item.title}</h4><div className="library-meta"><span>{subjects.find(s=>s.slug===item.subject_slug)?.short_name||item.subject_slug||'Unsorted'}</span>{unitName&&<span>{unitName}</span>}{topicName&&<span>{topicName}</span>}<span>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(item.created_at))}</span>}</div></div><span className={item.extraction_status==='ready'?'knowledge-ready':item.extraction_status==='failed'?'knowledge-failed':'knowledge-pending'}>{extractionLabel(item)}</span></div>
            {item.summary&&<p className="library-summary">{item.summary}</p>}
            {query&&searchMatches[item.id]&&<div className="library-search-match"><Search/><span><strong>Matching text</strong>{searchMatches[item.id]}</span></div>}
            {target&&<div className="library-feedback"><Target/><span><strong>Feedback target</strong>{target.target}</span></div>}
            {isExtracting&&<div className="library-extract-progress"><ScanText/><span><strong>Reading this resource locally</strong>{progress||'Working…'}</span></div>}
            {item.extraction_note&&item.extraction_status!=='ready'&&<p className="library-note">{item.extraction_note}</p>}
            {reviewOpen&&<div className="library-review">
              <div className="library-review-head"><CheckCircle2/><div><strong>Check where this belongs</strong><span>Kellyn Hub has suggested a filing location. Change it if needed, then confirm.</span></div></div>
              <div className="library-review-fields">
                <label>Subject<select value={draft.subject_slug} onChange={e=>setDraft({subject_slug:e.target.value,unit_slug:'',topic_slug:''})}><option value="">Not sure yet</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select></label>
                <label>Unit / area<select value={draft.unit_slug} onChange={e=>setDraft(current=>({...current,unit_slug:e.target.value,topic_slug:''}))}><option value="">Not sure yet</option>{unitsForSubject(draft.subject_slug).map(unit=><option key={unit.slug} value={unit.slug}>{unit.label}</option>)}</select></label>
                <label>Topic<select value={draft.topic_slug} onChange={e=>setDraft(current=>({...current,topic_slug:e.target.value}))}><option value="">Not sure yet</option>{topicsForUnit(draft.subject_slug,draft.unit_slug).map(topic=><option key={topic.slug} value={topic.slug}>{topic.label}</option>)}</select></label>
              </div>
              {reviewText&&<details className="library-text-preview"><summary>Preview extracted text</summary><pre>{reviewText.slice(0,6000)}{reviewText.length>6000?'\n\n…preview shortened':''}</pre></details>}
              <div className="library-review-actions"><button onClick={()=>confirmFiling(item)}><CheckCircle2/> Confirm filing</button><button className="secondary" onClick={()=>{setReviewing(null);setReviewText('')}}>Later</button></div>
            </div>}
            <div className="library-actions">
              {attached.map(file=>{const isImage=(file.mime_type||'').startsWith('image/');return <button key={file.id||file.storage_path} onClick={()=>openFile(file)} disabled={opening===(file.id||file.storage_path)}>{isImage?<Image/>:<File/>}{opening===(file.id||file.storage_path)?'Opening…':isImage?'View original':'Open file'}</button>})}
              {sourceFrom(item)&&<a href={sourceFrom(item)} target="_blank" rel="noreferrer"><ExternalLink/> Open source page</a>}
              {item.linked_task_id&&<button onClick={()=>go?.('work')}><CheckSquare/> Open My Work</button>}
              {(item.extraction_status==='pending'||item.extraction_status==='failed')&&canRead&&<button className="library-read" onClick={()=>readResource(item,attached)} disabled={isExtracting}><ScanText/> {isExtracting?'Reading…':'Read & organise'}</button>}
              {item.extraction_status==='needs_review'&&<button className="library-read" onClick={()=>startReview(item)}><CheckCircle2/> Check filing</button>}
              {item.extraction_status==='ready'&&<button onClick={()=>startReview(item)}><CheckCircle2/> Review filing</button>}
              <button className="library-archive" onClick={()=>archive(item)}><Archive/> Archive</button>
            </div>
          </div>
        </article>
      })}</div>
    </section>
  </div>
}
