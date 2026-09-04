import React,{useEffect,useMemo,useState} from 'react'
import {Archive,BookOpen,CheckSquare,ExternalLink,File,FolderOpen,Image,Search,Target} from 'lucide-react'
import {supabase} from './supabase.js'
import './phase4-library.css'

const PURPOSES={
  learn:{label:'Learn',icon:BookOpen,help:'Material Kellyn wants to understand, revise and use for future study.'},
  do:{label:'Do',icon:CheckSquare,help:'Schoolwork or instructions that have also been turned into My Work.'},
  improve:{label:'Improve',icon:Target,help:'Teacher feedback or marked work that should influence future practice.'},
  keep:{label:'Keep',icon:Archive,help:'Useful reference material that should stay searchable and easy to find.'}
}

function sourceFrom(item){return item.source_url||''}
function clean(value=''){return String(value||'').replace(/\s+/g,' ').trim()}

export default function Phase4Library({session,subjects=[],files=[],notify,go}){
  const [items,setItems]=useState([])
  const [targets,setTargets]=useState([])
  const [query,setQuery]=useState('')
  const [purpose,setPurpose]=useState('all')
  const [subject,setSubject]=useState('all')
  const [opening,setOpening]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{load()},[session?.user?.id])

  async function load(){
    if(!session?.user?.id)return
    setLoading(true)
    const uid=session.user.id
    const [{data:library,error:libraryError},{data:feedback,error:feedbackError}]=await Promise.all([
      supabase.from('library_items').select('*').eq('user_id',uid).eq('status','active').order('created_at',{ascending:false}),
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

  const counts=useMemo(()=>Object.fromEntries(Object.keys(PURPOSES).map(key=>[key,items.filter(x=>x.purpose===key).length])),[items])
  const filtered=useMemo(()=>{
    const q=clean(query).toLowerCase()
    return items.filter(item=>{
      if(purpose!=='all'&&item.purpose!==purpose)return false
      if(subject!=='all'&&item.subject_slug!==subject)return false
      if(!q)return true
      return [item.title,item.summary,item.extracted_text,item.subject_slug,item.unit_slug,item.topic_slug,...(item.tags||[])].some(value=>clean(value).toLowerCase().includes(q))
    })
  },[items,query,purpose,subject])

  return <div className="library-shell">
    <section className="library-hero">
      <div><span>Kellyn's Learning Library</span><h2>Everything useful, connected back to the original.</h2><p>Teacher handouts, screenshots, web pages, PDFs, notes, tasks and feedback can live here instead of disappearing into a capture list. Search what Kellyn has saved, open the original source, and see what each item is for.</p></div>
      <button onClick={()=>go?.('capture')}><FolderOpen/> Add or process captures</button>
    </section>

    <section className="library-purpose-grid">{Object.entries(PURPOSES).map(([key,meta])=>{const Icon=meta.icon;return <button key={key} className={purpose===key?'active':''} onClick={()=>setPurpose(purpose===key?'all':key)}><Icon/><span><strong>{meta.label}</strong><small>{meta.help}</small></span><b>{counts[key]||0}</b></button>})}</section>

    <section className="library-tools">
      <label className="library-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search everything Kellyn has saved"/></label>
      <select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">All subjects</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select>
      {(purpose!=='all'||subject!=='all'||query)&&<button onClick={()=>{setPurpose('all');setSubject('all');setQuery('')}}>Clear filters</button>}
    </section>

    {targets.length>0&&<section className="library-targets"><div className="library-section-title"><Target/><div><h3>Active teacher feedback</h3><p>Targets captured from marked work or teacher comments.</p></div></div>{targets.slice(0,4).map(t=><article key={t.id}><strong>{t.title}</strong><span>{t.subject_slug||'General'}</span><p>{t.target}</p></article>)}</section>}

    <section className="library-results">
      <div className="library-results-head"><div><h3>{purpose==='all'?'My Library':PURPOSES[purpose].label}</h3><p>{filtered.length} item{filtered.length===1?'':'s'} shown</p></div><small>AI retrieval and OCR will build on this library next.</small></div>
      {loading&&<div className="library-empty">Loading library…</div>}
      {!loading&&filtered.length===0&&<div className="library-empty"><FolderOpen/><strong>No matching library items yet.</strong><span>Process a capture as Learn, Do, Improve or Keep to add it here.</span></div>}
      <div className="library-list">{filtered.map(item=>{
        const meta=PURPOSES[item.purpose]||PURPOSES.keep,Icon=meta.icon
        const attached=files.filter(f=>f.capture_id===item.capture_id)
        const target=targets.find(t=>t.library_item_id===item.id)
        const knowledgeReady=Boolean(clean(item.extracted_text))
        return <article className="library-card" key={item.id}>
          <div className={`library-purpose purpose-${item.purpose}`}><Icon/><span>{meta.label}</span></div>
          <div className="library-card-main">
            <div className="library-title-row"><div><h4>{item.title}</h4><div className="library-meta"><span>{subjects.find(s=>s.slug===item.subject_slug)?.short_name||item.subject_slug||'Unsorted'}</span>{item.unit_slug&&<span>{item.unit_slug}</span>}{item.topic_slug&&<span>{item.topic_slug}</span>}<span>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(item.created_at))}</span></div></div><span className={knowledgeReady?'knowledge-ready':'knowledge-pending'}>{knowledgeReady?'Text searchable':'Original saved'}</span></div>
            {item.summary&&<p className="library-summary">{item.summary}</p>}
            {target&&<div className="library-feedback"><Target/><span><strong>Feedback target</strong>{target.target}</span></div>}
            <div className="library-actions">{attached.map(file=>{const isImage=(file.mime_type||'').startsWith('image/');return <button key={file.id||file.storage_path} onClick={()=>openFile(file)} disabled={opening===(file.id||file.storage_path)}>{isImage?<Image/>:<File/>}{opening===(file.id||file.storage_path)?'Opening…':isImage?'View original':'Open file'}</button>})}{sourceFrom(item)&&<a href={sourceFrom(item)} target="_blank" rel="noreferrer"><ExternalLink/> Open source page</a>}{item.linked_task_id&&<button onClick={()=>go?.('work')}><CheckSquare/> Open My Work</button>}<button className="library-archive" onClick={()=>archive(item)}><Archive/> Archive</button></div>
          </div>
        </article>
      })}</div>
    </section>
  </div>
}
