import React,{useEffect,useMemo,useRef,useState} from 'react'
import {supabase} from './supabase.js'

function weekForDate(value){const anchor=new Date(2026,7,31);anchor.setHours(0,0,0,0);const d=new Date(value);d.setHours(0,0,0,0);const w=Math.floor((d-anchor)/604800000);return (((w%2)+2)%2)+1}
function dayIndex(date){return ((date.getDay()+6)%7)+1}
function atTime(base,time){const d=new Date(base);const [h,m]=time.slice(0,5).split(':').map(Number);d.setHours(h,m,0,0);return d}
function minutesUntil(date){return Math.round((date-Date.now())/60000)}
function nextStep(task,steps){return steps.filter(s=>s.task_id===task.id&&!s.completed).sort((a,b)=>a.order_index-b.order_index)[0]}

export default function NotificationManager({session,timetable=[],tasks=[],steps=[]}){
  const [prefs,setPrefs]=useState(null);const sent=useRef(new Set())
  useEffect(()=>{if(!session?.user?.id)return;supabase.from('notification_preferences').select('*').eq('user_id',session.user.id).maybeSingle().then(({data})=>setPrefs(data))},[session?.user?.id])
  const openTasks=useMemo(()=>tasks.filter(t=>t.status!=='completed'),[tasks])
  useEffect(()=>{
    if(!prefs?.enabled||!('Notification'in window)||Notification.permission!=='granted')return
    const check=()=>{
      const now=new Date(),day=dayIndex(now),week=weekForDate(now)
      const today=timetable.filter(x=>x.day_of_week===day&&(x.week_number||1)===week&&['lesson','registration'].includes(x.entry_type))
      for(const row of today){const start=atTime(now,row.start_time);const mins=minutesUntil(start);const key=`lesson:${row.id}:${start.toISOString().slice(0,10)}`;if(mins>=0&&mins<=prefs.lesson_minutes_before&&!sent.current.has(key)){sent.current.add(key);new Notification(`${row.label} begins in ${mins} minute${mins===1?'':'s'}`,{body:`${row.room?`Room ${row.room}. `:''}Finish what you are doing and get ready to move.`,tag:key})}}
      if(prefs.nearly_finished){for(const task of openTasks.filter(t=>t.status==='nearly_finished')){const step=nextStep(task,steps);const key=`finish:${task.id}`;if(!sent.current.has(key)){sent.current.add(key);new Notification(`${task.title} is nearly finished`,{body:step?`One useful next step: ${step.title}`:'Open the task and complete the final check.',tag:key})}}}
      if(prefs.deadline_progress){for(const task of openTasks.filter(t=>t.due_at)){const due=new Date(task.due_at);const mins=minutesUntil(due);const threshold=Math.max(60,prefs.task_minutes_before||1440);const key=`deadline:${task.id}:${due.toISOString().slice(0,10)}`;if(mins>=0&&mins<=threshold&&!sent.current.has(key)){sent.current.add(key);const step=nextStep(task,steps);new Notification(`${task.title} is due soon`,{body:step?`Best next step: ${step.title}`:(task.next_action||'Open the task and choose the next action.'),tag:key})}}}
    }
    check();const id=setInterval(check,60000);return()=>clearInterval(id)
  },[prefs,timetable,openTasks,steps])
  return null
}
