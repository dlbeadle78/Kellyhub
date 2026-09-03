import React,{useEffect,useMemo,useState} from 'react'
import {BookOpen,Copy,ExternalLink,Headphones,NotebookTabs,Plus,Search,Sparkles,Video} from 'lucide-react'
import {supabase} from './supabase.js'
import {RESOURCE_CATALOGUE} from './resourceCatalogue.js'
import './phase2-resources.css'

const PROMPTS={
  explain:(subject,topic)=>`I am studying WJEC ${subject}. Teach me ${topic||'this topic'} at A-level/Level 3 standard using the sources in this notebook. Start with the key knowledge, then named evidence/examples, then analysis/evaluation. Use short sections. Ask me two retrieval questions at the end. Do not write assessed work for me.`,
  audio:(subject,topic)=>`Create an audio overview for WJEC ${subject} on ${topic||'the current topic'}. Cover the specification knowledge, important evidence/examples, common misunderstandings and the analysis/evaluation I need to understand. Keep it suitable for active revision rather than a superficial summary.`,
  video:(subject,topic)=>`Create a video overview for WJEC ${subject} on ${topic||'the current topic'}. Explain the topic step by step, include named evidence/cases/events where relevant, and finish with a visual recap of the main comparisons or arguments. Do not create assessed answers.`,
  flash:(subject,topic)=>`Create flashcards for WJEC ${subject} on ${topic||'the current topic'}. Mix definitions, named evidence/cases/events, application and evaluation. Keep each answer concise but at A-level/Level 3 depth.`,
  guide:(subject,topic)=>`Create a study guide for WJEC ${subject} on ${topic||'the current topic'}. Organise it as: specification coverage, core knowledge, named evidence, analysis/evaluation, common errors, retrieval practice and next revision steps. Do not draft assessed work.`
}
function copy(text,notify){navigator.clipboard?.writeText(text);notify?.('Prompt copied.')}

export default function Phase2Resources({session,subjects=[],notify}){
  const available=subjects.filter(s=>RESOURCE_CATALOGUE[s.slug]);const [subjectSlug,setSubjectSlug]=useState(available[0]?.slug||'sociology');const [query,setQuery]=useState('');const [topic,setTopic]=useState('');const [links,setLinks]=useState([]);const [title,setTitle]=useState('Main NotebookLM');const [url,setUrl]=useState('')
  const subject=subjects.find(s=>s.slug===subjectSlug);const catalogue=RESOURCE_CATALOGUE[subjectSlug]
  useEffect(()=>{if(!session?.user?.id)return;supabase.from('notebook_links').select('*').eq('user_id',session.user.id).then(({data,error})=>{if(error)notify?.(error.message);else setLinks(data||[])})},[session?.user?.id])
  const notebook=links.find(l=>l.subject_slug===subjectSlug&&l.active)
  const sections=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return catalogue?.sections||[];return (catalogue?.sections||[]).map(s=>({...s,items:s.items.filter(i=>`${i.title} ${i.kind} ${i.use}`.toLowerCase().includes(q))})).filter(s=>s.items.length)},[catalogue,query])
  async function saveNotebook(e){e.preventDefault();if(!url.trim())return;const payload={user_id:session.user.id,subject_slug:subjectSlug,unit_slug:null,title:title.trim()||'Main NotebookLM',url:url.trim(),active:true,updated_at:new Date().toISOString()};const {data,error}=await supabase.from('notebook_links').upsert(payload,{onConflict:'user_id,subject_slug,unit_slug,title'}).select().single();if(error)return notify?.(error.message);setLinks(cur=>[...cur.filter(x=>x.id!==data.id&&!(x.subject_slug===data.subject_slug&&x.title===data.title)),data]);setUrl('');notify?.('NotebookLM link saved.')}
  const subjectLabel=subject?.short_name||catalogue?.label||'Subject'
  return <div className="p2r-shell">
    <section className="p2r-head"><div><span>Phase 2 resources</span><h2>Learn here. Use official sources when needed.</h2><p>WJEC links are now organised as an internal catalogue. NotebookLM is a companion for source-heavy learning, not the main learning screen.</p></div><NotebookTabs/></section>
    <div className="p2r-subjects">{available.map(s=><button className={subjectSlug===s.slug?'active':''} onClick={()=>setSubjectSlug(s.slug)} key={s.slug}>{s.short_name}</button>)}</div>
    <div className="p2r-grid">
      <section className="p2r-catalogue"><div className="p2r-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${subjectLabel} resources`}/></div>{sections.map(section=><div className="p2r-section" key={section.title}><h3>{section.title}</h3>{section.items.map(item=><article key={item.url}><div><span>{item.kind}</span><strong>{item.title}</strong><p>{item.use}</p></div><a href={item.url} target="_blank" rel="noreferrer">Open <ExternalLink/></a></article>)}</div>)}</section>
      <aside className="p2r-companion">
        <div className="p2r-card"><div className="p2r-title"><Sparkles/>NotebookLM companion</div>{notebook?<><strong>{notebook.title}</strong><a className="p2r-open" href={notebook.url} target="_blank" rel="noreferrer">Open {subjectLabel} NotebookLM <ExternalLink/></a></>:<><p>No NotebookLM link saved for {subjectLabel} yet.</p><form onSubmit={saveNotebook}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notebook name"/><input value={url} onChange={e=>setUrl(e.target.value)} type="url" placeholder="Paste NotebookLM URL" required/><button><Plus/> Save link</button></form></>}
        </div>
        <div className="p2r-card"><div className="p2r-title"><BookOpen/>Create a useful prompt</div><label>Current topic <span>optional</span><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Chartism"/></label><div className="p2r-prompts"><button onClick={()=>copy(PROMPTS.explain(subjectLabel,topic),notify)}><BookOpen/>Teach this properly <Copy/></button><button onClick={()=>copy(PROMPTS.audio(subjectLabel,topic),notify)}><Headphones/>Audio overview <Copy/></button><button onClick={()=>copy(PROMPTS.video(subjectLabel,topic),notify)}><Video/>Video overview <Copy/></button><button onClick={()=>copy(PROMPTS.flash(subjectLabel,topic),notify)}><Sparkles/>Flashcards <Copy/></button><button onClick={()=>copy(PROMPTS.guide(subjectLabel,topic),notify)}><NotebookTabs/>Study guide <Copy/></button></div></div>
        <div className="p2r-boundary"><strong>Assessment boundary</strong><p>NotebookLM can explain, quiz and help Kellyn learn from her sources. It should not be asked to produce school-assessed answers, NEA text or Individual Project content for submission.</p></div>
      </aside>
    </div>
  </div>
}
