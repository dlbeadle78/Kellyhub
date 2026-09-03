import React,{useMemo,useState} from 'react'
import {Brain,CheckCircle2,Copy,Sparkles,Target,Timer,ShieldCheck,AlertTriangle,BookOpen,RefreshCw} from 'lucide-react'
import {supabase} from './supabase.js'
import {LEARNING_CONTENT} from './learningContent.js'
import {depthFor} from './learningDepthGuide.js'
import './phase3-practice.css'

const TYPES=[['recall','Quick recall'],['knowledge_check','Knowledge check'],['short_answer','Short answers'],['exam_question','Exam-style question'],['source_question','Source / evidence question'],['essay_plan','Essay planning'],['essay','Extended response'],['mock','Full mock']]
const DIFFICULTY=[['foundation','Build confidence'],['standard','A-level standard'],['challenge','Challenge']]
const fmt=v=>v?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v)):''
const pct=r=>r?.score!=null&&r?.score_out_of?Math.round(Number(r.score)/Number(r.score_out_of)*100):null

function typeLabel(value){return TYPES.find(x=>x[0]===value)?.[1]||value||'Practice'}
function markingPrompt(record,subject){
  return `This is PRACTICE ONLY and is not being submitted to school.\n\nSubject: WJEC ${subject||record.subject_slug||'subject'}\nPractice type: ${record.practice_type}\nQuestion:\n${record.question||record.title}\n\nLearner response:\n${record.response||'(response not supplied)'}\n\nMark scheme / assessment guidance supplied:\n${record.mark_scheme||'No specific guidance supplied. Give skills-based feedback only.'}\n\nMaximum mark: ${record.score_out_of||'not supplied'}\n\nGive concise educational feedback. Do not rewrite the answer or provide a submission-ready model response.`
}

export default function Phase3Practice({session,subjects=[],practice=[],loadAll,notify}){
  const defaultSubject=subjects.find(s=>LEARNING_CONTENT[s.slug])?.slug||'sociology'
  const [tab,setTab]=useState('cycle'),[busy,setBusy]=useState(''),[selected,setSelected]=useState(null)
  const [builder,setBuilder]=useState({subject:defaultSubject,unit:'',topic:'',type:'knowledge_check',difficulty:'standard',count:4,time:25,focus:''})
  const [paper,setPaper]=useState(null),[answers,setAnswers]=useState({})
  const subjectNames=Object.fromEntries(subjects.map(s=>[s.slug,s.short_name]))
  const records=useMemo(()=>[...practice].sort((a,b)=>new Date(b.completed_at)-new Date(a.completed_at)),[practice])
  const activeTargets=records.filter(r=>r.improvement_target&&r.target_status==='active')
  const availableSubjects=subjects.filter(s=>LEARNING_CONTENT[s.slug])
  const content=LEARNING_CONTENT[builder.subject]
  const units=content?.units||[]
  const selectedUnit=units.find(u=>u.slug===builder.unit)
  const topicOptions=selectedUnit?.topics||units.flatMap(u=>u.topics)
  const selectedTopic=topicOptions.find(t=>t.slug===builder.topic)

  function chooseSubject(subject){setBuilder(b=>({...b,subject,unit:'',topic:'',focus:''}));setPaper(null);setAnswers({})}
  function chooseUnit(unit){setBuilder(b=>({...b,unit,topic:''}));setPaper(null);setAnswers({})}

  function selectedTopicRows(){
    let chosen=units
    if(builder.unit) chosen=chosen.filter(u=>u.slug===builder.unit)
    let rows=chosen.flatMap(unit=>unit.topics.map(topic=>({unit,topic})))
    if(builder.topic) rows=rows.filter(row=>row.topic.slug===builder.topic)
    return rows
  }

  function curriculumContext(){
    return selectedTopicRows().map(({unit,topic})=>{
      const d=depthFor(builder.subject,topic.slug)||{}
      return [
        `UNIT: ${unit.title}`,
        `TOPIC: ${topic.title}`,
        `CORE: ${topic.summary||''}`,
        `KEY IDEAS: ${(topic.keyIdeas||[]).join(' | ')}`,
        `KEY TERMS: ${(topic.terms||[]).map(([term,definition])=>`${term}: ${definition}`).join(' | ')}`,
        `DETAILED KNOWLEDGE: ${(d.depth||[]).join(' ')}`,
        `EVIDENCE / AUTHORITIES / EXAMPLES: ${(d.evidence||[]).join(' | ')}`,
        `ANALYSIS: ${(d.analysis||[]).join(' | ')}`,
        `ASSESSMENT THINKING: ${d.exam||''}`
      ].join('\n')
    }).join('\n\n').slice(0,18000)
  }

  function scopeLabel(){
    if(selectedTopic)return selectedTopic.title
    if(selectedUnit)return selectedUnit.title
    return content?.intro?`${subjectNames[builder.subject]||builder.subject} Year 13 course`:'Selected course'
  }

  async function generatePractice(e){
    e?.preventDefault()
    if(!builder.subject)return notify?.('Choose a subject first.')
    setBusy('generate');setPaper(null);setAnswers({})
    const context=curriculumContext()
    if(!context){setBusy('');return notify?.('No learning content is available for that selection yet.')}
    const focus=builder.focus?` Improvement focus: ${builder.focus}`:''
    const {data,error}=await supabase.functions.invoke('mock-marker',{body:{action:'generate',practice_only:true,assessed:false,subject:subjectNames[builder.subject]||builder.subject,topic:`${scopeLabel()}${focus}`,practice_type:builder.type,difficulty:builder.difficulty,question_count:Number(builder.count),time_minutes:Number(builder.time),curriculum_context:context}})
    setBusy('')
    if(error)return notify?.(error.message||'Practice generation failed. Please try again.')
    if(!data?.configured)return notify?.('Practice generation is not configured on the server yet.')
    if(!data?.paper)return notify?.(data?.error||'No practice was generated. Please try again.')
    setPaper(data.paper);setTab('generate');notify?.('New practice generated. The marking guidance stays hidden until you finish.')
  }

  async function markRecord(record,afterSave=false){
    if(!record?.response)return notify?.('Add a practice response before requesting feedback.')
    setBusy(afterSave?'submit':record.id)
    const {data,error}=await supabase.functions.invoke('mock-marker',{body:{practice_only:true,assessed:false,subject:subjectNames[record.subject_slug]||record.subject_slug,question:record.question||record.title,response:record.response,mark_scheme:record.mark_scheme,max_mark:record.score_out_of,practice_type:record.practice_type}})
    if(error||!data?.configured||!data?.feedback){
      setBusy('');setSelected(record);setTab('review');await loadAll()
      return notify?.('Your answers were saved, but feedback is unavailable right now. You can request feedback again from Review.')
    }
    const f=data.feedback||{}
    const patch={score:f.score??record.score??null,score_out_of:f.score_out_of??record.score_out_of,feedback_good:Array.isArray(f.what_went_well)?f.what_went_well.slice(0,2):[],feedback_improve:Array.isArray(f.improve)?f.improve.slice(0,2):[],improvement_target:f.target||null,ai_feedback:f,marking_mode:'server_ai',target_status:f.target?'active':record.target_status}
    const {error:updateError}=await supabase.from('practice_records').update(patch).eq('id',record.id)
    setBusy('')
    if(updateError)return notify?.(updateError.message)
    const updated={...record,...patch};setSelected(updated);await loadAll();setTab('review');notify?.('Feedback ready. Use the target to choose your next practice.')
  }

  async function submitGenerated(){
    if(!paper)return
    const answered=paper.questions.filter(q=>(answers[q.id]||'').trim()).length
    if(!answered)return notify?.('Answer at least one question before finishing the practice.')
    setBusy('submit')
    const questionText=paper.questions.map((q,i)=>`Question ${i+1} (${q.marks} marks)\n${q.question}`).join('\n\n')
    const responseText=paper.questions.map((q,i)=>`Question ${i+1}\n${(answers[q.id]||'').trim()||'[No response]'}`).join('\n\n')
    const guidance=paper.questions.map((q,i)=>`Question ${i+1} (${q.marks} marks)\nExpected knowledge and skills: ${q.answer_guidance}\nFeedback focus: ${q.feedback_focus}`).join('\n\n')
    const payload={user_id:session.user.id,subject_slug:builder.subject,title:paper.title,practice_type:builder.type,question:questionText,response:responseText,mark_scheme:guidance,score_out_of:paper.total_marks,marking_mode:'generated_pending_feedback',reflection:`Kellyn Hub generated practice. Target time: ${paper.time_minutes} minutes.`,completed_at:new Date().toISOString()}
    const {data,error}=await supabase.from('practice_records').insert(payload).select().single()
    if(error){setBusy('');return notify?.(error.message)}
    setSelected(data);await loadAll();await markRecord(data,true)
  }

  async function copyPrompt(record){await navigator.clipboard?.writeText(markingPrompt(record,subjectNames[record.subject_slug]));notify?.('Practice feedback prompt copied.')}
  async function targetStatus(record,status){const {error}=await supabase.from('practice_records').update({target_status:status}).eq('id',record.id);if(error)return notify?.(error.message);await loadAll();notify?.(status==='improved'?'Target marked as improved.':'Target updated.')}
  function generateForTarget(record){setBuilder(b=>({...b,subject:record.subject_slug||defaultSubject,unit:'',topic:'',type:'knowledge_check',difficulty:'standard',count:4,time:20,focus:record.improvement_target||''}));setPaper(null);setAnswers({});setTab('generate')}

  const current=selected||records[0]
  return <div className="p3-practice">
    <section className="p3-practice-head"><div><span>Practice Mode</span><h2>Generate → Answer → Feedback → Target → Practise again</h2><p>Kellyn chooses what to practise. Kellyn Hub creates the questions and mock practice, Kellyn answers them herself, then the Hub gives learning feedback.</p></div><ShieldCheck/></section>
    <div className="p3-tabs"><button className={tab==='cycle'?'active':''} onClick={()=>setTab('cycle')}>Practice cycle</button><button className={tab==='generate'?'active':''} onClick={()=>setTab('generate')}>Generate practice</button><button className={tab==='review'?'active':''} onClick={()=>setTab('review')}>Review feedback</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>History</button></div>

    {tab==='cycle'&&<div className="p3-cycle-grid"><section className="p3-card"><div className="p3-title"><Target/><div><strong>Current improvement targets</strong><span>Feedback should lead to the next useful practice.</span></div></div>{activeTargets.slice(0,5).map(r=><article className="p3-target" key={r.id}><div><strong>{subjectNames[r.subject_slug]||'General'}</strong><p>{r.improvement_target}</p><small>From {r.title} · {fmt(r.completed_at)}</small></div><div className="p3-target-actions"><button onClick={()=>generateForTarget(r)}>Practise this</button><button className="secondary" onClick={()=>targetStatus(r,'improved')}>Target improved</button></div></article>)}{!activeTargets.length&&<p className="p3-empty">No active target yet. Generate a practice, answer it and use the feedback to create one.</p>}</section><section className="p3-card"><div className="p3-title"><Brain/><div><strong>Start a fresh practice</strong><span>You choose the scope and challenge. The site writes the task.</span></div></div><div className="p3-next"><Sparkles/><span>Generate recall, short questions, exam-style practice, source/evidence work, essay planning, extended responses or a full mock.</span></div><button onClick={()=>setTab('generate')}>Choose and generate</button></section></div>}

    {tab==='generate'&&<><form className="p3-builder" onSubmit={generatePractice}><div className="p3-form-head"><BookOpen/><div><h3>Build my practice</h3><p>Choose what you want to practise. You do not need to write the questions.</p></div></div><div className="p3-builder-grid"><label>Subject<select value={builder.subject} onChange={e=>chooseSubject(e.target.value)}>{availableSubjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select></label><label>Unit<select value={builder.unit} onChange={e=>chooseUnit(e.target.value)}><option value="">Whole subject</option>{units.map(u=><option key={u.slug} value={u.slug}>{u.title}</option>)}</select></label><label>Topic<select value={builder.topic} onChange={e=>{setBuilder({...builder,topic:e.target.value});setPaper(null)}}><option value="">All selected topics</option>{topicOptions.map(t=><option key={t.slug} value={t.slug}>{t.title}</option>)}</select></label><label>Practice type<select value={builder.type} onChange={e=>setBuilder({...builder,type:e.target.value})}>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Challenge<select value={builder.difficulty} onChange={e=>setBuilder({...builder,difficulty:e.target.value})}>{DIFFICULTY.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Number of questions<input type="number" min="1" max="12" value={builder.count} onChange={e=>setBuilder({...builder,count:Math.min(12,Math.max(1,Number(e.target.value)||1))})}/></label><label>Target time (minutes)<input type="number" min="5" max="180" value={builder.time} onChange={e=>setBuilder({...builder,time:Math.min(180,Math.max(5,Number(e.target.value)||5))})}/></label></div>{builder.focus&&<div className="p3-focus"><Target/><div><strong>Feedback focus</strong><span>{builder.focus}</span></div><button type="button" onClick={()=>setBuilder({...builder,focus:''})}>Clear</button></div>}<div className="p3-boundary"><AlertTriangle/><span>Generated tasks are Kellyn Hub practice, not official WJEC papers. Do not use this area for genuine assessed schoolwork or the assessed Welsh Bacc Individual Project.</span></div><button disabled={busy==='generate'}><Sparkles/>{busy==='generate'?'Generating…':'Generate my practice'}</button></form>

    {paper&&<section className="p3-paper"><div className="p3-paper-head"><div><span>Kellyn Hub generated practice · not official WJEC material</span><h3>{paper.title}</h3><p>{paper.instructions}</p></div><div className="p3-paper-meta"><strong>{paper.total_marks} marks</strong><span><Timer/> {paper.time_minutes} mins</span></div></div><div className="p3-question-list">{paper.questions.map((q,i)=><article className="p3-question" key={q.id}><div className="p3-question-top"><strong>Question {i+1}</strong><span>{q.marks} mark{q.marks===1?'':'s'}</span></div><p>{q.question}</p><label>Your answer<textarea rows={q.marks>=15?12:q.marks>=8?8:5} value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} placeholder="Write your answer in your own words here."/></label></article>)}</div><div className="p3-paper-actions"><button disabled={busy==='submit'} onClick={submitGenerated}><CheckCircle2/>{busy==='submit'?'Saving and checking…':'Finish and get feedback'}</button><button className="secondary" disabled={busy==='generate'||busy==='submit'} onClick={generatePractice}><RefreshCw/> Generate a different practice</button></div><small className="p3-note">The hidden guidance is used only after you submit, so you can attempt the questions independently first.</small></section>}</>}

    {tab==='review'&&<section className="p3-review">{current?<><div className="p3-review-head"><div><span>{subjectNames[current.subject_slug]||'General'} · {typeLabel(current.practice_type)}</span><h3>{current.title}</h3><small>{fmt(current.completed_at)}</small></div>{pct(current)!=null&&<div className="p3-score"><strong>{current.score}/{current.score_out_of}</strong><span>{pct(current)}%</span></div>}</div><div className="p3-review-grid"><div className="p3-card"><strong>Practice questions</strong><div className="p3-response">{current.question||current.title}</div><strong className="p3-response-heading">Kellyn's answers</strong><div className="p3-response">{current.response||'No response stored.'}</div></div><div className="p3-card"><strong>Practice feedback</strong>{current.feedback_good?.length?<><h4>What went well</h4>{current.feedback_good.map((x,i)=><div className="p3-feedback good" key={i}><CheckCircle2/>{x}</div>)}</>:<p className="p3-empty">No feedback stored yet.</p>}{current.feedback_improve?.length?<><h4>What to develop</h4>{current.feedback_improve.map((x,i)=><div className="p3-feedback improve" key={i}><Target/>{x}</div>)}</>:null}{current.ai_feedback?.question_feedback?.length?<div className="p3-feedback-by-question"><h4>Question-by-question feedback</h4>{current.ai_feedback.question_feedback.map((x,i)=><article key={i}><strong>{x.question||`Question ${i+1}`}</strong><p>{x.comment}</p></article>)}</div>:null}{current.improvement_target&&<div className="p3-target-box"><strong>Next target</strong><p>{current.improvement_target}</p><button onClick={()=>generateForTarget(current)}>Generate practice for this target</button></div>}{current.ai_feedback?.practice_activity&&<div className="p3-practice-activity"><strong>Short follow-up activity</strong><p>{current.ai_feedback.practice_activity}</p></div>}<div className="p3-review-actions"><button disabled={busy===current.id} onClick={()=>markRecord(current)}><Sparkles/> {busy===current.id?'Checking…':'Check again / get feedback'}</button><button className="secondary" onClick={()=>copyPrompt(current)}><Copy/> Copy feedback prompt</button></div><small className="p3-note">{current.ai_feedback?.caveat||'This is learning feedback on practice, not a predicted teacher grade. The Hub will not rewrite Kellyn’s answer.'}</small></div></div></>:<p className="p3-empty">Generate and complete a practice first.</p>}</section>}

    {tab==='history'&&<section className="p3-history"><h3>Practice history</h3>{records.map(r=><button key={r.id} onClick={()=>{setSelected(r);setTab('review')}}><span><strong>{r.title}</strong><small>{subjectNames[r.subject_slug]||'General'} · {typeLabel(r.practice_type)} · {fmt(r.completed_at)}</small></span><span>{r.score!=null?`${r.score}${r.score_out_of?`/${r.score_out_of}`:''}`:'Review'}</span></button>)}{!records.length&&<p className="p3-empty">No practice recorded yet.</p>}</section>}
  </div>
}
