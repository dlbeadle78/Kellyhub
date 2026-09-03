import React, { useEffect, useMemo, useState } from 'react'
import { BookOpen, Bus, CalendarDays, CheckCircle2, ChevronRight, Clock3, Lightbulb, MapPin, Target } from 'lucide-react'
import { taskPriorityScore } from './taskSupport.js'
import './phase1-today.css'

function timetableWeekForDate(value=new Date()){
  const anchor=new Date(2026,7,31);anchor.setHours(0,0,0,0)
  const current=new Date(value);current.setHours(0,0,0,0)
  const weekIndex=Math.floor((current-anchor)/604800000)
  return (((weekIndex%2)+2)%2)+1
}
function minutes(value){const [h,m]=String(value||'00:00').slice(0,5).split(':').map(Number);return h*60+m}
function nowMinutes(date){return date.getHours()*60+date.getMinutes()}
function fmtTime(value){return String(value||'').slice(0,5)}
function fmtDate(value){if(!value)return'';return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(value))}
function daysUntil(value){if(!value)return null;const a=new Date();a.setHours(0,0,0,0);const b=new Date(value);b.setHours(0,0,0,0);return Math.ceil((b-a)/86400000)}
function countdown(target,now){let diff=target-now;if(diff<0)return null;const h=Math.floor(diff/60),m=diff%60;return h?`${h}h ${m}m`:`${m} min`}

export default function Phase1Today({profile,subjects=[],tasks=[],steps=[],timetable=[],travel=[],go,setSelectedTaskId}){
  const [now,setNow]=useState(new Date())
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[])

  const day=now.getDay()
  const week=timetableWeekForDate(now)
  const currentMinutes=nowMinutes(now)
  const todays=timetable.filter(row=>row.day_of_week===day&&(row.week_number==null||row.week_number===week)).sort((a,b)=>String(a.start_time).localeCompare(String(b.start_time)))
  const currentEntry=todays.find(row=>minutes(row.start_time)<=currentMinutes&&minutes(row.end_time)>currentMinutes)
  const nextEntry=todays.find(row=>minutes(row.start_time)>currentMinutes)
  const openTasks=useMemo(()=>[...tasks].filter(t=>!['completed','submitted'].includes(t.status)).sort((a,b)=>taskPriorityScore(b)-taskPriorityScore(a)),[tasks])
  const bestTask=openTasks[0]
  const bestStep=bestTask?steps.filter(s=>s.task_id===bestTask.id&&!s.completed).sort((a,b)=>a.order_index-b.order_index)[0]:null
  const minutesFree=currentEntry?.entry_type==='free'?Math.max(0,minutes(currentEntry.end_time)-currentMinutes):0

  const direction=currentMinutes<9*60?'to_school':'from_school'
  const journeys=travel.filter(t=>t.direction===direction).sort((a,b)=>a.sequence-b.sequence)
  const departure=journeys[0]
  const departureMinutes=departure?minutes(departure.depart_time):null
  const busCountdown=departureMinutes!=null?countdown(departureMinutes,currentMinutes):null

  function openTask(task){if(!task)return;setSelectedTaskId?.(task.id);go?.('work')}

  return <div className="today-v2">
    <section className="today-v2-welcome"><div><span>{now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · Week {week}</span><h2>Good {now.getHours()<12?'morning':now.getHours()<18?'afternoon':'evening'}, {profile?.display_name||'Kellyn'}</h2><p>Keep today simple. See what is happening, then choose one useful next step.</p></div></section>

    <div className="today-v2-now-grid">
      <section className="today-v2-now"><div className="today-v2-title"><Clock3/><strong>Right now</strong></div>{day===0||day===6?<div className="today-v2-big"><span>No school timetable today</span><small>Use the planner for personal activities and planned study.</small></div>:currentEntry?<div className="today-v2-big"><span>{currentEntry.label}</span><strong>{fmtTime(currentEntry.start_time)}–{fmtTime(currentEntry.end_time)}</strong><small>{currentEntry.room?`${currentEntry.room} · `:''}{currentEntry.teacher||currentEntry.entry_type}</small></div>:<div className="today-v2-big"><span>{currentMinutes<8*60+45?'Before school':currentMinutes>=15*60+55?'School finished':'Transition time'}</span><small>{nextEntry?`Next: ${nextEntry.label} at ${fmtTime(nextEntry.start_time)}`:'No more timetable entries today.'}</small></div>}</section>

      <section className="today-v2-next"><div className="today-v2-title"><CalendarDays/><strong>Next</strong></div>{nextEntry?<><div className="today-v2-big"><span>{nextEntry.label}</span><strong>{fmtTime(nextEntry.start_time)}</strong><small>{nextEntry.room?`${nextEntry.room} · `:''}{nextEntry.teacher||nextEntry.entry_type}</small></div><span className="today-v2-countdown">in {Math.max(0,minutes(nextEntry.start_time)-currentMinutes)} minutes</span></>:<div className="today-v2-big"><span>No more school entries</span><small>Check travel and your next planned action.</small></div>}</section>

      <section className="today-v2-bus"><div className="today-v2-title"><Bus/><strong>{direction==='to_school'?'Journey to school':'Journey home'}</strong></div>{departure?<><div className="today-v2-big"><span>{departure.service}</span><strong>{fmtTime(departure.depart_time)}</strong><small><MapPin size={13}/>{departure.origin}</small></div>{busCountdown&&<span className="today-v2-countdown">leaves in {busCountdown}</span>}</>:<div className="today-v2-big"><span>No journey saved</span><small>Add travel information in Planner.</small></div>}</section>
    </div>

    <section className="today-v2-action"><div className="today-v2-action-icon"><Lightbulb/></div><div className="today-v2-action-copy"><span>What should I do now?</span>{bestTask?<><h2>{bestTask.title}</h2><strong>Today’s step: {bestStep?.title||bestTask.next_action||'Open the task and check what remains.'}</strong><p>{minutesFree>=10?`You currently have a ${minutesFree}-minute free period. Start with one short step and leave time to move to the next lesson.`:bestStep?.estimated_minutes?`Estimated time: about ${bestStep.estimated_minutes} minutes.`:'Start one manageable step. You do not need to finish the whole task now.'}</p><button onClick={()=>openTask(bestTask)}><Target/> Start this step</button></>:<><h2>No urgent work queued</h2><p>Use Subjects for a short learning or recall activity, or Quick Capture anything you need to organise later.</p><button onClick={()=>go?.('subjects')}><BookOpen/> Open Subjects</button></>}</div></section>

    <div className="today-v2-lower">
      <section className="today-v2-card"><div className="today-v2-title"><CalendarDays/><strong>Today’s timetable</strong></div>{todays.map(row=><div className={`today-v2-row ${currentEntry?.id===row.id?'current':''}`} key={row.id}><time>{fmtTime(row.start_time)}</time><span><strong>{row.label}</strong><small>{row.room||row.entry_type}{row.teacher?` · ${row.teacher}`:''}</small></span></div>)}{!todays.length&&<p className="today-v2-muted">No school timetable entries today.</p>}</section>

      <section className="today-v2-card"><div className="today-v2-title"><CheckCircle2/><strong>Your next 3 actions</strong></div>{openTasks.slice(0,3).map((task,index)=>{const step=steps.filter(s=>s.task_id===task.id&&!s.completed).sort((a,b)=>a.order_index-b.order_index)[0];const d=daysUntil(task.due_at);return <button className="today-v2-task" key={task.id} onClick={()=>openTask(task)}><span>{index+1}</span><span><strong>{task.title}</strong><small>{step?.title||task.next_action||'Open task'}{d!=null?` · ${d<0?'Overdue':d===0?'Due today':`${d} days`}`:''}</small></span><ChevronRight/></button>})}{!openTasks.length&&<p className="today-v2-muted">Nothing currently waiting in My Work.</p>}</section>

      <section className="today-v2-card"><div className="today-v2-title"><Bus/><strong>Journey steps</strong></div>{journeys.map(row=><div className="today-v2-row" key={row.id}><time>{fmtTime(row.depart_time)}</time><span><strong>{row.service}</strong><small>{row.origin} → {row.destination}</small></span></div>)}{!journeys.length&&<p className="today-v2-muted">No journey saved.</p>}</section>
    </div>
  </div>
}
