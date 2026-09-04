import React,{useEffect,useMemo,useState} from 'react'
import {BookOpen,ExternalLink,File,Image,LoaderCircle,Search,Sparkles} from 'lucide-react'
import {supabase} from './supabase.js'
import {topicLabel,unitLabel} from './libraryKnowledge.js'
import './ask-library.css'

const STUDY_URL='https://chatgpt.com/studymode'

function clean(value=''){return String(value||'').replace(/\s+/g,' ').trim()}
function excerpt(value='',max=1150){const text=clean(value);return text.length>max?`${text.slice(0,max).trim()}…`:text}

async function copyText(value){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return}
  const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()
}

export default function AskLibraryPanel({session,subjects=[],files=[],notify}){
  const [question,setQuestion]=useState('')
  const [subject,setSubject]=useState('all')
  const [rows,setRows]=useState([])
  const [searched,setSearched]=useState(false)
  const [busy,setBusy]=useState(false)
  const [opening,setOpening]=useState(null)
  const [pendingReviewCount,setPendingReviewCount]=useState(0)

  useEffect(()=>{
    const uid=session?.user?.id
    if(!uid)return
    supabase.from('library_items').select('id',{count:'exact',head:true}).eq('user_id',uid).eq('status','active').eq('extraction_status','needs_review').then(({count})=>setPendingReviewCount(count||0))
  },[session?.user?.id])

  const sources=useMemo(()=>{
    const map=new Map()
    for(const row of rows){
      let source=map.get(row.library_item_id)
      if(!source){source={...row,snippets:[]};map.set(row.library_item_id,source)}
      if(source.snippets.length<2&&!source.snippets.some(text=>text===row.content))source.snippets.push(row.content)
    }
    return [...map.values()].slice(0,6)
  },[rows])

  async function ask(e){
    e?.preventDefault()
    const q=question.trim()
    if(q.length<3)return notify?.('Ask a little more about what you want to find.')
    setBusy(true);setSearched(true)
    const {data,error}=await supabase.rpc('search_library_knowledge',{p_query:q,p_subject_slug:subject==='all'?null:subject,p_limit:30})
    setBusy(false)
    if(error){setRows([]);return notify?.(error.message)}
    setRows(data||[])
  }

  function reviewPending(){
    document.querySelector('.library-list')?.scrollIntoView({behavior:'smooth',block:'start'})
  }

  async function openFile(file){
    if(!file?.storage_path)return
    setOpening(file.id||file.storage_path)
    const preview=window.open('about:blank','_blank')
    if(preview){preview.opener=null;preview.document.title='Opening source…'}
    const {data,error}=await supabase.storage.from('user-files').createSignedUrl(file.storage_path,600)
    setOpening(null)
    if(error||!data?.signedUrl){if(preview)preview.close();return notify?.(error?.message||'Could not open this source.')}
    if(preview)preview.location.replace(data.signedUrl)
    else window.open(data.signedUrl,'_blank','noopener,noreferrer')
  }

  function buildStudyPrompt(){
    const chosenSubject=subject==='all'?null:subjects.find(s=>s.slug===subject)
    const qualification=chosenSubject?.name||'my WJEC Year 13 studies'
    const sourceText=sources.map((source,index)=>{
      const subjectName=subjects.find(s=>s.slug===source.subject_slug)?.short_name||source.subject_slug||'Unsorted'
      const unit=unitLabel(source.subject_slug,source.unit_slug)
      const topic=topicLabel(source.subject_slug,source.unit_slug,source.topic_slug)
      const heading=[subjectName,unit,topic].filter(Boolean).join(' · ')
      const passages=source.snippets.map((text,n)=>`Excerpt ${n+1}: ${excerpt(text,1400)}`).join('\n')
      return `[${index+1}] ${source.title}\nArea: ${heading||'Not classified'}\n${passages}`
    }).join('\n\n')

    return `@Study\nI am studying ${qualification}.\n\nMy question is: ${question.trim()}\n\nUse the saved material below as my primary class/teacher source material. Teach me from it rather than simply giving me a finished answer. You may add accurate WJEC A-level context where it helps understanding, but clearly distinguish extra teaching from what my saved sources actually say. If the sources disagree or are incomplete, tell me.\n\nPlease:\n- teach in short, clear, dyslexia-friendly chunks;\n- start by checking what I already understand;\n- ask one question at a time;\n- build from explanation to application, analysis and evaluation where appropriate for A level;\n- use examples to make difficult ideas concrete;\n- refer back to the numbered sources when using my saved material;\n- do not write assessed work, homework or a submission-ready answer for me.\n\nSAVED SOURCES FROM KELLYN HUB\n${sourceText}\n\nStart by briefly telling me which saved sources are most useful for my question, then ask me one short diagnostic question.`
  }

  async function copyStudyPrompt(openStudy=false){
    if(!sources.length)return notify?.('Find some matching sources first.')
    if(openStudy)window.open(STUDY_URL,'_blank','noopener,noreferrer')
    try{await copyText(buildStudyPrompt());notify?.(openStudy?'Study prompt copied. Paste it into the ChatGPT Study tab.':'Study prompt copied.')}
    catch{notify?.('Could not copy the Study prompt. Try again from this browser.')}
  }

  return <section className="ask-library">
    <div className="ask-library-head">
      <div className="ask-library-icon"><Sparkles/></div>
      <div><span>Ask My Library</span><h3>Study using Kellyn's own saved sources</h3><p>Ask a question and Kellyn Hub finds the most relevant passages in confirmed screenshots, PDFs, handouts and notes. Nothing is sent to ChatGPT unless Kellyn chooses the Study handoff.</p></div>
    </div>
    {pendingReviewCount>0&&<div className="ask-library-review-note"><BookOpen/><span><strong>{pendingReviewCount} source{pendingReviewCount===1?' is':'s are'} waiting for filing confirmation.</strong><small>Confirm them before Ask My Library treats them as trusted study material.</small></span><button type="button" onClick={reviewPending}>Review sources</button></div>}
    <form className="ask-library-form" onSubmit={ask}>
      <label><span>What do you want to understand?</span><textarea rows="2" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g. Explain labelling theory using my teacher material"/></label>
      <div className="ask-library-controls"><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">Search all subjects</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select><button disabled={busy}><Search/>{busy?'Finding sources…':'Find in my Library'}</button></div>
    </form>

    {busy&&<div className="ask-library-loading"><LoaderCircle/><span>Searching confirmed learning material…</span></div>}
    {!busy&&searched&&sources.length===0&&<div className="ask-library-empty"><BookOpen/><strong>No matching confirmed source yet.</strong><span>{pendingReviewCount>0?`${pendingReviewCount} saved source${pendingReviewCount===1?' still needs':'s still need'} filing confirmation. Review those first, or try fewer topic words.`:'Try fewer topic words, change the subject filter, or use Read & organise on more captured material.'}</span>{pendingReviewCount>0&&<button type="button" onClick={reviewPending}>Review sources waiting below</button>}</div>}
    {!busy&&sources.length>0&&<div className="ask-library-results">
      <div className="ask-library-results-head"><div><strong>{sources.length} useful source{sources.length===1?'':'s'} found</strong><span>Read the evidence first, then continue in Study Mode if useful.</span></div><div><button type="button" className="secondary" onClick={()=>copyStudyPrompt(false)}>Copy Study prompt</button><button type="button" className="study" onClick={()=>copyStudyPrompt(true)}><Sparkles/> Study these sources in ChatGPT</button></div></div>
      <div className="ask-source-list">{sources.map((source,index)=>{
        const subjectName=subjects.find(s=>s.slug===source.subject_slug)?.short_name||source.subject_slug||'Unsorted'
        const unit=unitLabel(source.subject_slug,source.unit_slug),topic=topicLabel(source.subject_slug,source.unit_slug,source.topic_slug)
        const attached=files.filter(file=>file.capture_id===source.capture_id)
        return <article className="ask-source" key={source.library_item_id}>
          <div className="ask-source-number">{index+1}</div>
          <div className="ask-source-main"><div className="ask-source-title"><div><h4>{source.title}</h4><span>{[subjectName,unit,topic].filter(Boolean).join(' · ')}</span></div><small>Saved source</small></div>
          <div className="ask-source-snippets">{source.snippets.map((text,n)=><div key={n}><strong>Relevant passage{source.snippets.length>1?` ${n+1}`:''}</strong><p>{excerpt(text)}</p></div>)}</div>
          <div className="ask-source-actions">{attached.map(file=>{const isImage=(file.mime_type||'').startsWith('image/');const key=file.id||file.storage_path;return <button type="button" key={key} onClick={()=>openFile(file)} disabled={opening===key}>{isImage?<Image/>:<File/>}{opening===key?'Opening…':isImage?'View original':'Open original'}</button>})}{source.source_url&&<a href={source.source_url} target="_blank" rel="noreferrer"><ExternalLink/> Open source page</a>}</div></div>
        </article>
      })}</div>
      <p className="ask-library-boundary">The Study handoff copies only the question and the displayed source excerpts. Kellyn decides whether to paste and send them to ChatGPT.</p>
    </div>}
  </section>
}
