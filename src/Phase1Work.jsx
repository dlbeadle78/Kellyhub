import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, FileText, HelpCircle, Lightbulb, Plus, ShieldCheck, Target, Upload, X } from 'lucide-react'
import { supabase } from './supabase.js'
import SpeechControls from './SpeechControls.jsx'
import { BEFORE_SUBMISSION, COMMAND_WORDS, buildSafeSteps, taskPriorityScore, understandTask } from './taskSupport.js'
import './phase1-work.css'

const STATUS_LABEL = {
  not_started: 'Not started',
  started: 'Started',
  nearly_finished: 'Nearly finished',
  submitted: 'Submitted',
  waiting_feedback: 'Waiting for feedback',
  feedback: 'Feedback received',
  changes_needed: 'Changes needed',
  completed: 'Completed'
}

function fmtDate(value) {
  if (!value) return 'No deadline'
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(value))
}
function daysUntil(value) {
  if (!value) return null
  const a=new Date(); a.setHours(0,0,0,0)
  const b=new Date(value); b.setHours(0,0,0,0)
  return Math.ceil((b-a)/86400000)
}
function safeFileName(name='file') { return name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-') }

export default function Phase1Work({ session, subjects=[], tasks=[], steps=[], files=[], loadAll, notify, selectedTaskId, setSelectedTaskId }) {
  const [filter,setFilter]=useState('open')
  const [showAdd,setShowAdd]=useState(false)
  const [showCommands,setShowCommands]=useState(false)
  const [showUpcoming,setShowUpcoming]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [focusTaskId,setFocusTaskId]=useState(null)
  const [feedbackNotes,setFeedbackNotes]=useState([])
  const [feedbackText,setFeedbackText]=useState('')

  const ranked = useMemo(()=>[...tasks].sort((a,b)=>taskPriorityScore(b)-taskPriorityScore(a)),[tasks])
  const visible = ranked.filter(task => {
    if(filter==='open') return !['completed','submitted'].includes(task.status)
    if(filter==='all') return true
    return task.status===filter
  })
  const selected = tasks.find(t=>t.id===selectedTaskId) || visible[0] || tasks[0] || null
  const taskSteps = selected ? steps.filter(s=>s.task_id===selected.id).sort((a,b)=>a.order_index-b.order_index) : []
  const taskFiles = selected ? files.filter(f=>f.task_id===selected.id) : []
  const incompleteSteps = taskSteps.filter(s=>!s.completed)
  const focusTask = tasks.find(t=>t.id===focusTaskId)
  const focusSteps = focusTask ? steps.filter(s=>s.task_id===focusTask.id).sort((a,b)=>a.order_index-b.order_index) : []
  const focusCurrent = focusSteps.find(s=>!s.completed)
  const understanding = selected ? understandTask(`${selected.title}. ${selected.description || ''}`) : null
  const nearlyFinished = ranked.filter(t=>t.status==='nearly_finished')

  useEffect(()=>{
    if(!selected?.id){setFeedbackNotes([]);return}
    supabase.from('task_notes').select('*').eq('task_id',selected.id).eq('note_type','teacher_feedback').order('created_at',{ascending:false})
      .then(({data,error})=>{if(error) notify?.(error.message); else setFeedbackNotes(data||[])})
  },[selected?.id])

  async function addTask(e){
    e.preventDefault()
    const fd=new FormData(e.currentTarget)
    const payload={
      user_id:session.user.id,
      title:String(fd.get('title')||'').trim(),
      description:String(fd.get('description')||'').trim()||null,
      subject_slug:fd.get('subject')||null,
      due_at:fd.get('due')?new Date(`${fd.get('due')}T16:00:00`).toISOString():null,
      estimated_minutes:fd.get('minutes')?Number(fd.get('minutes')):null,
      status:'not_started',
      priority:Number(fd.get('priority')||2),
      assessed:fd.get('assessed')==='on'
    }
    const {data,error}=await supabase.from('tasks').insert(payload).select().single()
    if(error)return notify(error.message)
    const generated=buildSafeSteps(data)
    const rows=generated.map((title,index)=>({task_id:data.id,user_id:session.user.id,title,order_index:index,estimated_minutes:index<3?10:null}))
    const {error:stepError}=await supabase.from('task_steps').insert(rows)
    if(stepError)return notify(stepError.message)
    e.currentTarget.reset();setShowAdd(false);setSelectedTaskId(data.id);await loadAll();notify('Task added and broken into safe starting steps.')
  }

  async function updateTask(patch){
    if(!selected)return
    const {error}=await supabase.from('tasks').update(patch).eq('id',selected.id)
    if(error)return notify(error.message)
    await loadAll()
  }

  async function regenerateSteps(){
    if(!selected)return
    const fresh=buildSafeSteps(selected)
    const {error:deleteError}=await supabase.from('task_steps').delete().eq('task_id',selected.id)
    if(deleteError)return notify(deleteError.message)
    const {error}=await supabase.from('task_steps').insert(fresh.map((title,index)=>({task_id:selected.id,user_id:session.user.id,title,order_index:index,estimated_minutes:index<3?10:null})))
    if(error)return notify(error.message)
    await loadAll();notify('Steps updated from the task instruction.')
  }

  async function toggleStep(step){
    const done=!step.completed
    const {error}=await supabase.from('task_steps').update({completed:done,completed_at:done?new Date().toISOString():null}).eq('id',step.id)
    if(error)return notify(error.message)
    const siblings=steps.filter(s=>s.task_id===step.task_id)
    const doneCount=siblings.filter(s=>s.id===step.id?done:s.completed).length
    const nextStatus=doneCount===siblings.length?'nearly_finished':doneCount>0?'started':'not_started'
    await supabase.from('tasks').update({status:nextStatus,next_action:siblings.find(s=>s.id!==step.id&&!s.completed)?.title||null}).eq('id',step.task_id)
    await loadAll()
  }

  async function uploadTaskFile(event){
    const list=Array.from(event.target.files||[])
    if(!selected||!list.length)return
    setUploading(true)
    for(const file of list){
      const path=`${session.user.id}/tasks/${selected.id}/${Date.now()}-${safeFileName(file.name)}`
      const {error:storageError}=await supabase.storage.from('user-files').upload(path,file,{upsert:false})
      if(storageError){notify(storageError.message);continue}
      const {error}=await supabase.from('user_files').insert({user_id:session.user.id,task_id:selected.id,subject_slug:selected.subject_slug,storage_path:path,original_name:file.name,mime_type:file.type,size_bytes:file.size,file_type:'other'})
      if(error)notify(error.message)
    }
    setUploading(false);event.target.value='';await loadAll();notify('File added to the task.')
  }

  async function addFeedback(e){
    e.preventDefault()
    if(!selected||!feedbackText.trim())return
    const {data,error}=await supabase.from('task_notes').insert({task_id:selected.id,user_id:session.user.id,note:feedbackText.trim(),note_type:'teacher_feedback'}).select().single()
    if(error)return notify(error.message)
    setFeedbackNotes(current=>[data,...current]);setFeedbackText('')
    await supabase.from('tasks').update({status:'feedback',next_action:'Read the teacher feedback and turn it into one action.'}).eq('id',selected.id)
    await loadAll();notify('Teacher feedback saved.')
  }

  async function toggleSubmissionCheck(key,value){
    if(!selected)return
    const checks={...(selected.submission_checks||{}),[key]:value}
    const {error}=await supabase.from('tasks').update({submission_checks:checks}).eq('id',selected.id)
    if(error)return notify(error.message)
    await loadAll()
  }

  const allSubmissionChecked=selected&&BEFORE_SUBMISSION.every(([key])=>selected.submission_checks?.[key])

  return <div className="p1-work-shell">
    <div className="p1-work-top">
      <div><h2>My Work</h2><p>See what matters, understand the task, then do one useful step.</p></div>
      <button className="p1-primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add task</button>
    </div>

    {nearlyFinished.length>0&&<section className="p1-nearly"><CheckCircle2/><div><strong>Nearly finished</strong><span>{nearlyFinished[0].title} has only a small amount left. Finishing it may be more useful than starting something new.</span></div><button onClick={()=>setSelectedTaskId(nearlyFinished[0].id)}>Finish this <ChevronRight size={16}/></button></section>}

    <div className="p1-filters">
      {[['open','Open'],['not_started','Not started'],['started','Started'],['nearly_finished','Nearly finished'],['feedback','Feedback'],['completed','Completed'],['all','All']].map(([value,label])=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label}</button>)}
    </div>

    <div className="p1-work-grid">
      <section className="p1-queue">
        <div className="p1-queue-head"><strong>Work queue</strong><span>{visible.length} task{visible.length===1?'':'s'}</span></div>
        {visible.map(task=>{
          const due=daysUntil(task.due_at)
          const ownSteps=steps.filter(s=>s.task_id===task.id)
          const done=ownSteps.filter(s=>s.completed).length
          return <button key={task.id} className={`p1-task-row ${selected?.id===task.id?'active':''}`} onClick={()=>setSelectedTaskId(task.id)}>
            <span className="p1-task-icon"><FileText size={17}/></span>
            <span className="p1-task-copy"><strong>{task.title}</strong><small>{subjects.find(s=>s.slug===task.subject_slug)?.short_name||'General'} · {fmtDate(task.due_at)}</small></span>
            <span className={`p1-status status-${task.status}`}>{STATUS_LABEL[task.status]||task.status}</span>
            <span className="p1-next">{task.next_action||ownSteps.find(s=>!s.completed)?.title||'Open task'}</span>
            <span className="p1-task-progress">{ownSteps.length?`${done}/${ownSteps.length}`:''}{due!=null&&<small>{due<0?'overdue':due===0?'today':`${due}d`}</small>}</span>
          </button>
        })}
        {!visible.length&&<div className="p1-empty">Nothing in this view.</div>}
      </section>

      <section className="p1-detail">
        {!selected?<div className="p1-empty">Add a task to get started.</div>:<>
          <div className="p1-detail-head"><div><span className="p1-kicker">{subjects.find(s=>s.slug===selected.subject_slug)?.short_name||'Task'}</span><h2>{selected.title}</h2><p>{selected.due_at?`Due ${fmtDate(selected.due_at)}`:'No deadline set'}</p></div><select value={selected.status} onChange={e=>updateTask({status:e.target.value})}>{Object.entries(STATUS_LABEL).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div>

          <section className="p1-understand">
            <div className="p1-section-title"><Lightbulb size={19}/><div><strong>What is this asking me?</strong><span>Support with the instruction, not the assessed answer.</span></div></div>
            {selected.description?<blockquote>{selected.description}</blockquote>:<p className="p1-muted">No teacher instruction has been added yet. Edit/re-add the task with the exact wording when available.</p>}
            <div className="p1-simple"><strong>In simple terms</strong><p>{understanding.simple}</p>{understanding.command&&<button onClick={()=>setShowCommands(true)}>What does {understanding.command.label} mean?</button>}</div>
            <ol>{understanding.parts.map(part=><li key={part}>{part}</li>)}</ol>
            <button className="p1-secondary" onClick={regenerateSteps}>Update my steps from this instruction</button>
          </section>

          <section className="p1-steps">
            <div className="p1-section-title"><Target size={19}/><div><strong>One step at a time</strong><span>{incompleteSteps.length?`${incompleteSteps.length} step${incompleteSteps.length===1?'':'s'} remaining`:'All current steps checked'}</span></div></div>
            {taskSteps.map((step,index)=><label key={step.id} className={step.completed?'done':''}><input type="checkbox" checked={step.completed} onChange={()=>toggleStep(step)}/><span className="p1-step-number">{index+1}</span><span>{step.title}<small>{step.estimated_minutes?`About ${step.estimated_minutes} minutes`:''}</small></span></label>)}
            {taskSteps.length>0&&<button className="p1-primary p1-focus-button" onClick={()=>setFocusTaskId(selected.id)}><Target size={17}/> Start Focus Mode</button>}
          </section>

          <section className="p1-files"><div className="p1-section-title"><Upload size={19}/><div><strong>Files & teacher material</strong><span>Keep the task brief, worksheets, drafts and feedback together.</span></div></div><label className="p1-upload"><Upload size={19}/><span>{uploading?'Uploading…':'Add files'}</span><input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.heic" onChange={uploadTaskFile} disabled={uploading}/></label>{taskFiles.map(file=><div className="p1-file-row" key={file.id}><FileText size={16}/><span>{file.original_name}</span></div>)}</section>

          <section className="p1-feedback"><div className="p1-section-title"><HelpCircle size={19}/><div><strong>Teacher feedback → action</strong><span>Record what the teacher wants changed. The Hub will not rewrite the work.</span></div></div><form onSubmit={addFeedback}><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} rows="3" placeholder="Paste or type teacher feedback in the teacher’s words"/><button className="p1-secondary">Save feedback</button></form>{feedbackNotes.slice(0,3).map(note=><div className="p1-feedback-note" key={note.id}><strong>Teacher feedback</strong><p>{note.note}</p><div><Lightbulb size={15}/><span>First action: read the affected section of your own work, then identify exactly what the feedback asks you to improve.</span></div></div>)}</section>

          <section className="p1-submit"><div className="p1-section-title"><ClipboardCheck size={19}/><div><strong>Before you submit</strong><span>A short independent-work check.</span></div></div>{BEFORE_SUBMISSION.map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(selected.submission_checks?.[key])} onChange={e=>toggleSubmissionCheck(key,e.target.checked)}/><span>{label}</span></label>)}{allSubmissionChecked&&<div className="p1-ready"><ShieldCheck size={18}/><span>Checks complete. When you are happy, submit the work to your teacher using the school’s normal system.</span></div>}</section>
        </>}
      </section>
    </div>

    {showAdd&&<div className="p1-modal-backdrop" role="dialog" aria-modal="true"><div className="p1-modal"><button className="p1-close" onClick={()=>setShowAdd(false)} aria-label="Close"><X/></button><h2>Add schoolwork</h2><p>Enter the teacher wording when you have it. The Hub will create safe starting steps, not an answer.</p><form onSubmit={addTask} className="p1-form"><label>Task title<input name="title" required placeholder="e.g. History source task"/></label><label>Teacher instruction<textarea name="description" rows="5" placeholder="Paste the exact task or brief here"/></label><div className="p1-form-two"><label>Subject<select name="subject"><option value="">Choose subject</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select></label><label>Deadline<input name="due" type="date"/></label></div><div className="p1-form-two"><label>Estimated total time<input name="minutes" type="number" min="1" max="1440" placeholder="minutes"/></label><label>Priority<select name="priority" defaultValue="2"><option value="1">Normal</option><option value="2">Important</option><option value="3">High</option></select></label></div><label className="p1-checkline"><input type="checkbox" name="assessed"/><span>This is real assessed schoolwork</span></label><button className="p1-primary">Add task and create steps</button></form></div></div>}

    {showCommands&&<div className="p1-modal-backdrop" role="dialog" aria-modal="true"><div className="p1-modal p1-command-modal"><button className="p1-close" onClick={()=>setShowCommands(false)} aria-label="Close"><X/></button><h2>Command words</h2><p>These explain the action. They do not answer the question.</p>{Object.values(COMMAND_WORDS).map(item=><article key={item.label}><strong>{item.label}</strong><p>{item.simple}</p><small>{item.cue}</small></article>)}</div></div>}

    {focusTask&&<div className="p1-focus" role="dialog" aria-modal="true"><button className="p1-focus-exit" onClick={()=>setFocusTaskId(null)}><X/> Stop for now</button><div className="p1-focus-inner"><span className="p1-kicker">Focus Mode · {focusSteps.filter(s=>s.completed).length+1} of {focusSteps.length}</span><h1>{focusTask.title}</h1>{focusCurrent?<><div className="p1-focus-step"><span>Current step</span><strong>{focusCurrent.title}</strong>{focusCurrent.estimated_minutes&&<small>Estimated time: {focusCurrent.estimated_minutes} minutes</small>}</div><SpeechControls text={focusCurrent.title} label="Read this"/><button className="p1-focus-done" onClick={()=>toggleStep(focusCurrent)}><CheckCircle2/> Done</button></>:<div className="p1-focus-step"><strong>Current steps complete.</strong><span>Review the task before marking it submitted or completed.</span></div>}</div></div>}
  </div>
}
