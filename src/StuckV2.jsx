import React, { useMemo, useState } from 'react'
import { BookOpen, ChevronRight, CloudUpload, HelpCircle, Lightbulb, Sparkles, Target } from 'lucide-react'
import { taskPriorityScore } from './taskSupport.js'
import SpeechControls from './SpeechControls.jsx'
import './stuck-v2.css'

export default function StuckV2({tasks=[],steps=[],subjects=[],practice=[],go,setSelectedTaskId}){
  const [choice,setChoice]=useState(null)
  const open=useMemo(()=>[...tasks].filter(t=>!['completed','submitted'].includes(t.status)).sort((a,b)=>taskPriorityScore(b)-taskPriorityScore(a)),[tasks])
  const best=open[0]
  const bestStep=best?steps.filter(s=>s.task_id===best.id&&!s.completed).sort((a,b)=>a.order_index-b.order_index)[0]:null
  const practiceCount=new Map(subjects.map(s=>[s.slug,practice.filter(p=>p.subject_slug===s.slug).length]))
  const reviseSubject=[...subjects].sort((a,b)=>(practiceCount.get(a.slug)||0)-(practiceCount.get(b.slug)||0))[0]

  const result={
    understand:{title:'I don’t understand this',body:best?`Open ${best.title}. Use “What is this asking me?” to see the command word, the parts of the instruction and the first safe step. The Hub will explain the task without writing the answer.`:'Open My Work and add the teacher instruction. The Hub can then unpack what the task is asking without answering it.',action:'Open My Work',route:'work'},
    next:{title:'I don’t know what to do next',body:best?`Focus on ${best.title}. Your next step is: ${bestStep?.title||best.next_action||'open the task and check what remains'}. Do that one step before deciding anything else.`:'There is no open task in My Work. Check Today or Quick Capture for anything that still needs organising.',action:best?'Start this task':'Open Today',route:best?'work':'today'},
    tooMuch:{title:'There is too much to do',body:best?`Ignore the rest for the moment. The best task to focus on first is ${best.title}. Start with: ${bestStep?.title||'open the task and read the instruction once'}. You can stop after that step.`:'Your My Work queue is currently clear. If the work is on paper or in Teams, use Quick Capture first so it is in one place.',action:best?'One task only':'Quick Capture',route:best?'work':'capture'},
    start:{title:'Help me start',body:best?`Starting does not mean finishing ${best.title}. Your only job now is: ${bestStep?.title||'open the task'}. When that is done, decide whether to continue or stop for now.`:'Add the piece of work to My Work or Quick Capture. The first step is simply getting it into the Hub.',action:best?'Start Focus Mode':'Quick Capture',route:best?'work':'capture'},
    revise:{title:'I don’t know what to revise',body:reviseSubject?`Start with ${reviseSubject.short_name}. Open Subjects, choose one current Year 13 topic and use Learn → Key terms → Check. Aim for one short topic rather than “revise ${reviseSubject.short_name}”.`:'Open Subjects and choose one current topic. Learn one small section, then do the recall check.',action:'Open Subjects',route:'subjects'}
  }
  const current=choice?result[choice]:null
  function act(){if(best&&['understand','next','tooMuch','start'].includes(choice))setSelectedTaskId?.(best.id);go?.(current.route)}

  return <div className="stuck-v2"><div className="stuck-v2-head"><span>Immediate support</span><h2>I’m Stuck</h2><p>Choose the closest problem. Kellyn Hub will reduce it to one next action.</p></div><div className="stuck-v2-grid"><button onClick={()=>setChoice('understand')}><HelpCircle/><span>I don’t understand this</span></button><button onClick={()=>setChoice('next')}><Sparkles/><span>I don’t know what to do next</span></button><button onClick={()=>setChoice('tooMuch')}><CloudUpload/><span>There is too much to do</span></button><button onClick={()=>setChoice('start')}><Target/><span>Help me start</span></button><button onClick={()=>setChoice('revise')}><BookOpen/><span>I don’t know what to revise</span></button></div>{current&&<section className="stuck-v2-result"><Lightbulb/><div><span>One step at a time</span><h2>{current.title}</h2><p>{current.body}</p><div className="stuck-v2-actions"><button onClick={act}>{current.action}<ChevronRight/></button><SpeechControls text={current.body} label="Read this"/></div></div></section>}<div className="stuck-v2-calm">You do not need to solve the whole day. Decide one useful action, start it, then reassess.</div></div>
}
