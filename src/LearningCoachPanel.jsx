import React,{useMemo,useState} from 'react'
import {BookOpen,Brain,CheckCircle2,LoaderCircle,MessageCircle,ShieldCheck,Sparkles} from 'lucide-react'
import {supabase} from './supabase.js'
import SpeechControls from './SpeechControls.jsx'
import {assessIntegrityRequest,SAFE_SUPPORT_OPTIONS} from './assessmentIntegrity.js'
import './learning-coach.css'

function clean(value=''){return String(value||'').replace(/\s+/g,' ').trim()}
function clip(value='',max=1250){const text=clean(value);return text.length>max?`${text.slice(0,max).trim()}…`:text}

export default function LearningCoachPanel({
  subjects=[],subjectSlug,unit,topic,section,knowledgeContext='',notify
}){
  const [question,setQuestion]=useState('')
  const [busy,setBusy]=useState(false)
  const [reply,setReply]=useState(null)
  const [blocked,setBlocked]=useState(null)
  const [sources,setSources]=useState([])
  const [responseKey,setResponseKey]=useState(0)
  const subjectName=subjects.find(s=>s.slug===subjectSlug)?.short_name||subjectSlug

  const replyText=useMemo(()=>{
    if(!reply)return''
    const example=reply.real_world_example
    return [reply.title,...(reply.teaching_chunks||[]),example?.title,example?.example,example?.demonstrates?`What this demonstrates. ${example.demonstrates}`:'',reply.key_takeaway?`Key takeaway. ${reply.key_takeaway}`:'',reply.check_question?`Check your understanding. ${reply.check_question}`:''].filter(Boolean).join('. ')
  },[reply])

  async function teach(value=question,mode='explain'){
    const q=clean(value)
    if(q.length<3)return notify?.('Ask a little more about what you want to understand.')
    const integrity=assessIntegrityRequest(q)
    if(integrity.blocked){setReply(null);setSources([]);setBlocked(integrity);return}
    setBlocked(null);setBusy(true);setReply(null);setSources([])

    let libraryRows=[]
    const {data:found,error:searchError}=await supabase.rpc('search_library_knowledge',{p_query:`${q} ${topic?.title||''}`.trim(),p_subject_slug:subjectSlug||null,p_limit:12})
    if(!searchError)libraryRows=found||[]
    const unique=[]
    const seen=new Set()
    for(const row of libraryRows){
      const key=`${row.library_item_id}:${row.chunk_index}`
      if(seen.has(key))continue
      seen.add(key);unique.push(row)
      if(unique.length>=6)break
    }
    const libraryContext=unique.map((row,index)=>`[Library ${index+1}] ${row.title}\n${clip(row.content,1500)}`).join('\n\n')

    const {data,error}=await supabase.functions.invoke('learning-coach',{body:{
      question:q,mode,subject:subjectName,unit:unit?.title||'',topic:topic?.title||'',section_title:section?.title||'',knowledge_context:String(knowledgeContext||'').slice(0,18000),library_context:libraryContext,request_assessed_answer:false
    }})
    setBusy(false)
    if(error){return notify?.(error.message||'The learning coach is unavailable right now.')}
    if(data?.blocked){setBlocked({blocked:true,safeReply:data.message||integrity.safeReply});setSources([]);return}
    if(!data?.configured){return notify?.(data?.message||'The learning coach is not configured yet.')}
    if(!data?.reply){return notify?.(data?.error||'The learning coach did not return a usable explanation.')}
    setQuestion(q);setReply(data.reply);setSources(unique);setResponseKey(Date.now())
  }

  function quick(mode){
    const title=section?.title||topic?.title||'this topic'
    const prompts={
      another_way:`Explain ${title} in a different way. Keep the A-level accuracy but use a different route or analogy to help me understand it.`,
      deeper:`Take me deeper into ${title}. Focus on the theory, evidence, connections, limitations and what an A-level learner should understand beyond the basics.`,
      quiz:`Quiz me on ${title}. Ask one diagnostic question that checks whether I genuinely understand it rather than just recognise the words.`,
      compare:`Help me compare and connect ${title} with another relevant idea, theory, case, event or interpretation from this subject.`
    }
    teach(prompts[mode]||`Explain ${title}.`,mode)
  }

  return <section className="coach-panel">
    <div className="coach-head"><div className="coach-icon"><Brain/></div><div><span>AI teacher / coach</span><h3>Ask about what you are learning</h3><p>The coach uses the Kellyn Hub knowledge bank and matching confirmed Library material. It teaches and questions. It does not complete schoolwork.</p></div></div>

    <div className="coach-quick" aria-label="Quick teaching actions">
      <button type="button" onClick={()=>quick('another_way')}>Explain another way</button>
      <button type="button" onClick={()=>quick('deeper')}>Go deeper</button>
      <button type="button" onClick={()=>quick('quiz')}>Quiz me</button>
      <button type="button" onClick={()=>quick('compare')}>Compare & connect</button>
    </div>

    <form onSubmit={e=>{e.preventDefault();teach()}} className="coach-form">
      <label><span>What do you want help understanding?</span><textarea rows="3" value={question} onChange={e=>setQuestion(e.target.value)} placeholder={`e.g. I don't understand ${section?.title||topic?.title||'this section'} yet. Explain it differently.`}/></label>
      <button disabled={busy}><MessageCircle/>{busy?'Teaching…':'Ask my teacher'}</button>
    </form>

    {busy&&<div className="coach-loading"><LoaderCircle/><span>Finding the most useful knowledge and Library sources…</span></div>}

    {blocked&&<div className="coach-blocked"><ShieldCheck/><div><strong>Learning support only</strong><p>{blocked.safeReply}</p><div>{SAFE_SUPPORT_OPTIONS.slice(0,4).map(option=><span key={option}>{option}</span>)}</div></div></div>}

    {reply&&<div className="coach-reply">
      <div className="coach-reply-head"><div><span>Teacher explanation</span><h4>{reply.title}</h4></div><SpeechControls text={replyText} contentKey={`coach:${subjectSlug}:${unit?.slug}:${topic?.slug}:${section?.id||section?.title}:${responseKey}`} compact label="Listen"/></div>
      <div className="coach-chunks">{(reply.teaching_chunks||[]).map((chunk,index)=><section key={index}><span>{index+1}</span><p>{chunk}</p></section>)}</div>
      {reply.real_world_example&&<section className="coach-example"><div className="coach-example-label">Real-world example</div><strong>{reply.real_world_example.title}</strong><p>{reply.real_world_example.example}</p><div className="coach-demonstrates"><Sparkles/><span><strong>What this demonstrates</strong>{reply.real_world_example.demonstrates}</span></div></section>}
      {reply.key_takeaway&&<div className="coach-takeaway"><BookOpen/><span><strong>Key takeaway</strong>{reply.key_takeaway}</span></div>}
      {reply.check_question&&<div className="coach-check"><CheckCircle2/><span><strong>Check your understanding</strong>{reply.check_question}</span></div>}
      {sources.length>0&&<details className="coach-sources"><summary>{sources.length} matching Library passage{sources.length===1?'':'s'} considered</summary>{sources.map((source,index)=><p key={`${source.library_item_id}-${source.chunk_index}`}><strong>{index+1}. {source.title}</strong><span>{clip(source.content,500)}</span></p>)}</details>}
      {reply.source_note&&<small className="coach-source-note">{reply.source_note}</small>}
    </div>}
  </section>
}
