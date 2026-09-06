import React,{useEffect,useMemo,useRef,useState} from 'react'
import {BookOpen,Brain,CalendarDays,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,ExternalLink,FileText,Focus,FolderOpen,GraduationCap,Lightbulb,Scale,Sparkles,Target} from 'lucide-react'
import {supabase} from './supabase.js'
import {LEARNING_CONTENT} from './learningContent.js'
import {depthFor} from './learningDepthGuide.js'
import {textbookFor,SUBJECT_ASSESSMENT_LINKS} from './textbookContent.js'
import {exampleFor} from './realWorldExamples.js'
import SpeechControls from './SpeechControls.jsx'
import LearningCoachPanel from './LearningCoachPanel.jsx'
import './learning-v2.css'

const LOCATION_KEY='kellyn-learning-location-v2'
const CHATGPT_STUDY_URL='https://chatgpt.com/studymode'
const STATUS_LABELS={not_started:'Not started',needs_review:'Need another look',developing:'Getting there',getting_there:'Getting there',confident:'Confident'}
const SUBJECT_META={
  sociology:{icon:'◉',tone:'mint'},law:{icon:'⚖',tone:'peach'},history:{icon:'⌂',tone:'blue'},'welsh-bacc':{icon:'★',tone:'lilac'}
}
const RESOURCE_LINKS={
  sociology:{wjec:'https://www.wjec.co.uk/qualifications/sociology-as-a-level/',guide:'https://github.com/dlbeadle78/kellynwjec/blob/main/subjects/sociology/study-guide-year-2.pdf'},
  law:{wjec:'https://www.wjec.co.uk/qualifications/law-as-a-level/',guide:'https://github.com/dlbeadle78/kellynwjec/blob/main/subjects/law/study-guide-year-2.pdf'},
  history:{wjec:'https://www.wjec.co.uk/qualifications/history-as-a-level/',guide:'https://github.com/dlbeadle78/kellynwjec/blob/main/subjects/history/study-guide-year-2.pdf'},
  'welsh-bacc':{wjec:'https://www.wjec.co.uk/qualifications/level-3-advanced-skills-baccalaureate-wales/',guide:'https://github.com/dlbeadle78/kellynwjec/blob/main/subjects/advanced-skills-baccalaureate/study-guide.pdf'}
}

function readSaved(){try{return JSON.parse(localStorage.getItem(LOCATION_KEY)||'{}')}catch{return{}}}
function shortHeading(value='',fallback='A-level depth'){
  const first=String(value).split(/[.!?]/)[0].trim()
  if(!first)return fallback
  return first.length>76?`${first.slice(0,73).trim()}…`:first
}
function fallbackCopy(value){try{const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok}catch{return false}}

function makeSections(layer,{subjectSlug,topic,textbook,depth}){
  const real=(index)=>exampleFor(subjectSlug,topic.slug,index)
  if(layer==='essential'){
    const rows=[{
      id:'start',title:'Start here',label:'Essential knowledge',body:topic.summary,bullets:topic.keyIdeas||[],example:real(0),takeaway:topic.keyIdeas?.[0]||topic.summary
    }]
    if(textbook?.sections?.length){
      textbook.sections.forEach((item,index)=>rows.push({id:`textbook-${index}`,title:item.title,label:'Concept / knowledge',body:item.body,example:real(index+1),takeaway:textbook.compare?.[index%Math.max(1,textbook.compare?.length||1)]||item.body}))
    }else{
      ;(topic.keyIdeas||[]).forEach((idea,index)=>rows.push({id:`idea-${index}`,title:`Key idea ${index+1}`,label:'Concept / knowledge',body:idea,example:real(index+1),takeaway:idea}))
    }
    rows.push({id:'terms',title:'Key terminology',label:'Language to know',terms:topic.terms||[],takeaway:'Accurate terminology helps you explain ideas precisely rather than relying on vague wording.'})
    return rows
  }
  if(layer==='deeper'){
    const rows=(depth?.depth||[]).map((body,index)=>({id:`depth-${index}`,title:shortHeading(body,`Deeper learning ${index+1}`),label:'Deeper A-level understanding',body,example:real(index),takeaway:depth?.analysis?.[index%Math.max(1,depth?.analysis?.length||1)]||body}))
    if(depth?.evidence?.length)rows.push({id:'evidence',title:'Named evidence, cases and authorities',label:'Evidence to know',bullets:depth.evidence,example:real(rows.length),takeaway:'Know what each piece of evidence actually supports, challenges or qualifies.'})
    if(textbook?.compare?.length)rows.push({id:'connections',title:'Compare, challenge and connect',label:'Deeper connections',bullets:textbook.compare,example:real(rows.length+1),takeaway:'A-level depth comes from explaining relationships and limits, not from adding disconnected facts.'})
    return rows.length?rows:[{id:'deeper-start',title:'Go deeper',label:'Deeper A-level understanding',body:'Use the named evidence, competing explanations and limitations for this topic to move beyond basic description.',bullets:depth?.analysis||[],example:real(0)}]
  }
  return [
    {id:'exam-thinking',title:'What strong exam thinking does',label:'Exam thinking',body:depth?.exam||'Apply the exact knowledge to the command word, use relevant evidence and make a reasoned judgement rather than listing everything you remember.',bullets:depth?.analysis||[],example:real(0),takeaway:'Answer the exact question. Evidence should prove an analytical point rather than sit beside it.'},
    {id:'practice',title:'Apply the knowledge safely',label:'Practice, not live schoolwork',body:topic.activity,bullets:textbook?.assessment||[],example:real(1),takeaway:'Practice is where you test knowledge and reasoning. Real school assessment remains Kellyn’s own work.'},
    {id:'retrieval',title:'Check what you can retrieve',label:'Retrieval check',recall:topic.recall||[],takeaway:'If you can explain the answer without rereading, the knowledge is becoming more usable.'}
  ]
}

function studyPrompt({subjectName,subjectSlug,unit,topic,section,depth}){
  const example=section.example
  return [
    '@Study','',`Teach me this part of ${subjectSlug==='welsh-bacc'?'WJEC Level 3 Advanced Skills Baccalaureate Wales':`WJEC A Level ${subjectName}`}.`,
    `Unit: ${unit.title}`,`Topic: ${topic.title}`,`Section: ${section.title}`,'',
    section.body||'',...(section.bullets||[]).map(x=>`- ${x}`),
    example?`Real example: ${example.title}. ${example.example} What it demonstrates: ${example.demonstrates}`:'',
    depth?.spec?`Specification focus: ${depth.spec}`:'','',
    'Teach me in short steps. Ask one question at a time. Keep the full A-level accuracy and use relevant evidence, cases, studies or events.',
    'Do not write, complete, answer or rewrite assessed schoolwork for me. If I show you a school task, explain what it requires and teach the knowledge without producing the submission.'
  ].filter(Boolean).join('\n')
}

export default function LearningSubjectsV2({session,subjects=[],tasks=[],practice=[],go,notify}){
  const saved=useMemo(()=>readSaved(),[])
  const availableSubjects=subjects.filter(s=>LEARNING_CONTENT[s.slug])
  const defaultSubject=availableSubjects.some(s=>s.slug===saved.subjectSlug)?saved.subjectSlug:(availableSubjects[0]?.slug||'sociology')
  const [subjectSlug,setSubjectSlug]=useState(defaultSubject)
  const [unitSlug,setUnitSlug]=useState(saved.unitSlug||null)
  const [topicSlug,setTopicSlug]=useState(saved.topicSlug||null)
  const [layer,setLayer]=useState(['essential','deeper','exam'].includes(saved.layer)?saved.layer:'essential')
  const [tool,setTool]=useState('learn')
  const [expanded,setExpanded]=useState('')
  const [progress,setProgress]=useState([])
  const [busyStatus,setBusyStatus]=useState(false)
  const [revealed,setRevealed]=useState({})
  const [focus,setFocus]=useState(()=>typeof document!=='undefined'&&document.body.classList.contains('focus-app'))
  const readableRefs=useRef({})

  const content=LEARNING_CONTENT[subjectSlug]
  const units=content?.units||[]
  const unit=units.find(u=>u.slug===unitSlug)||units[0]
  const topic=unit?.topics?.find(t=>t.slug===topicSlug)||unit?.topics?.[0]
  const depth=topic?depthFor(subjectSlug,topic.slug):null
  const textbook=topic?textbookFor(subjectSlug,topic.slug):null
  const sections=useMemo(()=>topic?makeSections(layer,{subjectSlug,topic,textbook,depth}):[],[layer,subjectSlug,topic?.slug,textbook,depth])
  const activeSection=sections.find(s=>s.id===expanded)||sections[0]

  useEffect(()=>{
    if(!unit)return
    if(unit.slug!==unitSlug)setUnitSlug(unit.slug)
    if(topic&&topic.slug!==topicSlug)setTopicSlug(topic.slug)
  },[subjectSlug,unit?.slug,topic?.slug])

  useEffect(()=>{setExpanded(sections[0]?.id||'');setRevealed({})},[subjectSlug,unit?.slug,topic?.slug,layer])

  useEffect(()=>{
    if(!session?.user?.id)return
    supabase.from('learning_progress').select('*').eq('user_id',session.user.id).then(({data,error})=>{if(error)notify?.(error.message);else setProgress(data||[])})
  },[session?.user?.id])

  useEffect(()=>{
    if(!topic||!unit)return
    try{localStorage.setItem(LOCATION_KEY,JSON.stringify({subjectSlug,unitSlug:unit.slug,topicSlug:topic.slug,layer}))}catch{}
  },[subjectSlug,unit?.slug,topic?.slug,layer])

  const progressMap=useMemo(()=>{const map=new Map();for(const row of progress)map.set(`${row.subject_slug}:${row.unit_slug}:${row.topic_slug}`,row);return map},[progress])
  const currentRow=topic&&unit?progressMap.get(`${subjectSlug}:${unit.slug}:${topic.slug}`):null
  const currentStatus=currentRow?.status||'not_started'
  const flatTopics=units.flatMap(u=>u.topics.map(t=>({unit:u,topic:t})))
  const currentFlatIndex=flatTopics.findIndex(row=>row.unit.slug===unit?.slug&&row.topic.slug===topic?.slug)
  const previous=flatTopics[currentFlatIndex-1]
  const next=flatTopics[currentFlatIndex+1]
  const subjectRows=flatTopics.map(row=>progressMap.get(`${subjectSlug}:${row.unit.slug}:${row.topic.slug}`)).filter(Boolean)
  const confident=subjectRows.filter(r=>r.status==='confident').length
  const started=subjectRows.filter(r=>r.status&&r.status!=='not_started').length
  const subjectProgress=flatTopics.length?Math.round(((started*.45)+(confident*.55))/flatTopics.length*100):0
  const subjectRecord=subjects.find(s=>s.slug===subjectSlug)
  const subjectName=subjectRecord?.short_name||subjectSlug
  const relatedTasks=tasks.filter(t=>t.subject_slug===subjectSlug&&t.status!=='completed')
  const assessmentLinks=SUBJECT_ASSESSMENT_LINKS[subjectSlug]||[]
  const links=RESOURCE_LINKS[subjectSlug]||{}

  const knowledgeContext=useMemo(()=>{
    if(!topic||!unit)return''
    return [
      `SUBJECT: ${subjectName}`,`UNIT: ${unit.title}`,`TOPIC: ${topic.title}`,`CORE: ${topic.summary}`,
      `KEY IDEAS: ${(topic.keyIdeas||[]).join(' | ')}`,
      `KEY TERMS: ${(topic.terms||[]).map(([a,b])=>`${a}: ${b}`).join(' | ')}`,
      `TEXTBOOK: ${textbook?.overview||''} ${(textbook?.sections||[]).map(s=>`${s.title}: ${s.body}`).join(' ')}`,
      `DEEPER KNOWLEDGE: ${(depth?.depth||[]).join(' ')}`,
      `EVIDENCE: ${(depth?.evidence||[]).join(' | ')}`,
      `ANALYSIS: ${(depth?.analysis||[]).join(' | ')}`,
      `EXAM THINKING: ${depth?.exam||''}`
    ].join('\n').slice(0,18000)
  },[subjectSlug,unit?.slug,topic?.slug,textbook,depth])

  if(!content||!unit||!topic)return <div className="empty">Learning content is loading.</div>

  function chooseSubject(slug){
    const nextContent=LEARNING_CONTENT[slug],nextUnit=nextContent?.units?.[0],nextTopic=nextUnit?.topics?.[0]
    setSubjectSlug(slug);setUnitSlug(nextUnit?.slug||null);setTopicSlug(nextTopic?.slug||null);setLayer('essential');setTool('learn')
  }
  function chooseUnit(slug){const nextUnit=units.find(u=>u.slug===slug)||units[0];setUnitSlug(nextUnit.slug);setTopicSlug(nextUnit.topics[0]?.slug||null);setLayer('essential');setTool('learn')}
  function chooseTopic(slug){setTopicSlug(slug);setLayer('essential');setTool('learn')}
  function goTopic(row){if(!row)return;setUnitSlug(row.unit.slug);setTopicSlug(row.topic.slug);setLayer('essential');setTool('learn');window.setTimeout(()=>document.getElementById('lv2-topic')?.scrollIntoView({behavior:'smooth',block:'start'}),30)}
  function chooseLayer(value){setLayer(value);setTool('learn')}
  function toggleFocus(){const next=!document.body.classList.contains('focus-app');document.body.classList.toggle('focus-app',next);setFocus(next)}

  async function setStatus(status){
    if(!session?.user?.id)return
    setBusyStatus(true)
    const payload={user_id:session.user.id,subject_slug:subjectSlug,unit_slug:unit.slug,topic_slug:topic.slug,status,last_opened_at:new Date().toISOString()}
    const {data,error}=await supabase.from('learning_progress').upsert(payload,{onConflict:'user_id,subject_slug,unit_slug,topic_slug'}).select().single()
    setBusyStatus(false)
    if(error)return notify?.(error.message)
    setProgress(rows=>[...rows.filter(r=>!(r.subject_slug===subjectSlug&&r.unit_slug===unit.slug&&r.topic_slug===topic.slug)),data])
    notify?.(`Learning status: ${STATUS_LABELS[status]||status}`)
  }

  function openStudy(section){
    const prompt=studyPrompt({subjectName,subjectSlug,unit,topic,section,depth})
    window.open(CHATGPT_STUDY_URL,'_blank','noopener,noreferrer')
    const done=()=>notify?.(`Study prompt copied for ${section.title}. Paste it into ChatGPT Study Mode.`)
    const fail=()=>{if(fallbackCopy(prompt))return done();window.prompt('Copy this Study Mode prompt:',prompt)}
    navigator.clipboard?.writeText?navigator.clipboard.writeText(prompt).then(done).catch(fail):fail()
  }

  function SectionBody({section,index}){
    const refKey=`${layer}:${section.id}`
    return <div className="lv2-section-body">
      <div className="lv2-readable" ref={node=>{readableRefs.current[refKey]=node}}>
        {(section.body||section.bullets?.length||section.terms?.length)&&<div className="lv2-concept"><span>{section.label||'Concept / knowledge'}</span>{section.body&&<p>{section.body}</p>}{section.bullets?.length>0&&<ul>{section.bullets.map((item,i)=><li key={`${i}-${item}`}>{item}</li>)}</ul>}{section.terms?.length>0&&<dl>{section.terms.map(([term,definition])=><div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>}</div>}
        {section.example&&<div className="lv2-example"><span>Real-world example</span><strong>{section.example.title}</strong><p>{section.example.example}</p><div className="lv2-demonstrates"><Sparkles/><div><strong>What this demonstrates</strong><p>{section.example.demonstrates}</p></div></div></div>}
        {section.recall?.length>0&&<div className="lv2-recall">{section.recall.map(([question,answer],i)=><article key={question}><strong>{i+1}. {question}</strong>{revealed[i]?<p><span>Check:</span> {answer}</p>:<button type="button" onClick={()=>setRevealed(v=>({...v,[i]:true}))}>Show answer</button>}</article>)}</div>}
      </div>
      <div className="lv2-section-actions"><SpeechControls getText={()=>readableRefs.current[refKey]?.innerText||''} contentKey={`${subjectSlug}:${unit.slug}:${topic.slug}:${layer}:${section.id}`} compact label="Listen"/>{!section.recall&&<button type="button" className="lv2-study" onClick={()=>openStudy(section)}><GraduationCap/>Study in ChatGPT<ExternalLink/></button>}</div>
    </div>
  }

  return <div className={`learning-v2 ${focus?'local-focus':''}`}>
    <div className="lv2-subjects" aria-label="Choose subject">{availableSubjects.map(s=><button key={s.slug} className={s.slug===subjectSlug?'active':''} onClick={()=>chooseSubject(s.slug)}>{s.short_name}</button>)}</div>

    <div className="lv2-layout">
      <aside className="lv2-side" aria-label="Units and topics">
        <div className="lv2-side-title"><BookOpen/><span><strong>{subjectName}</strong><small>Choose a unit and topic</small></span></div>
        <label>Unit<select value={unit.slug} onChange={e=>chooseUnit(e.target.value)}>{units.map(u=><option value={u.slug} key={u.slug}>{u.title}</option>)}</select></label>
        <div className="lv2-topic-list">{unit.topics.map((item,index)=><button type="button" className={item.slug===topic.slug?'active':''} key={item.slug} onClick={()=>chooseTopic(item.slug)}><span>{index+1}</span><span><strong>{item.title}</strong><small>{STATUS_LABELS[progressMap.get(`${subjectSlug}:${unit.slug}:${item.slug}`)?.status||'not_started']}</small></span></button>)}</div>
      </aside>

      <main className="lv2-main" id="lv2-topic">
        <header className="lv2-topic-head">
          <div className="lv2-breadcrumb"><span>{subjectName}</span><ChevronRight/><span>{unit.title}</span><ChevronRight/><strong>{topic.title}</strong></div>
          <div className="lv2-title-row"><div><span className="lv2-kicker">A-level learning · about {topic.time} minutes</span><h2>{topic.title}</h2></div><button type="button" className="lv2-focus-button" onClick={toggleFocus}><Focus/>{focus?'Exit Focus':'Focus Mode'}</button></div>
          <div className="lv2-progress"><span>Subject progress</span><div><i style={{width:`${subjectProgress}%`}}/></div><strong>{subjectProgress}%</strong></div>
          {depth?.spec&&<details className="lv2-spec"><summary><Scale/>WJEC specification focus</summary><p>{depth.spec}</p></details>}
        </header>

        <nav className="lv2-layers" aria-label="Learning depth">
          <button className={layer==='essential'?'active':''} onClick={()=>chooseLayer('essential')}><span>Essential</span><small>Core knowledge</small></button>
          <button className={layer==='deeper'?'active':''} onClick={()=>chooseLayer('deeper')}><span>Deeper</span><small>Evidence & debate</small></button>
          <button className={layer==='exam'?'active':''} onClick={()=>chooseLayer('exam')}><span>Exam Thinking</span><small>Apply & evaluate</small></button>
        </nav>

        <nav className="lv2-tools" aria-label="Learning tools">
          {[['learn','Learn',BookOpen],['resources','Resources',FolderOpen],['practise','Practise',Target],['ask','Ask',Brain],['plan','Plan',CalendarDays]].map(([key,label,Icon])=><button type="button" key={key} className={tool===key?'active':''} onClick={()=>setTool(key)}><Icon/>{label}</button>)}
        </nav>

        {tool==='learn'&&<div className="lv2-learning-grid">
          <div className="lv2-sections">
            <div className="lv2-layer-intro"><span>{layer==='essential'?'ESSENTIAL':layer==='deeper'?'DEEPER':'EXAM THINKING'}</span><p>{layer==='essential'?'Build secure knowledge first. Open one section at a time.':layer==='deeper'?'Add theory, evidence, criticism and connections without putting everything on screen at once.':'Use the knowledge. Apply it, compare it, evaluate it and practise without completing live school assessment.'}</p></div>
            {sections.map((section,index)=>{
              const open=activeSection?.id===section.id
              return <section className={`lv2-accordion ${open?'open':''}`} key={section.id}>
                <button type="button" className="lv2-accordion-head" aria-expanded={open} onClick={()=>setExpanded(section.id)}><span className="lv2-section-number">{index+1}</span><span><small>{section.label}</small><strong>{section.title}</strong></span><ChevronDown/></button>
                {open&&<SectionBody section={section} index={index}/>} 
              </section>
            })}
          </div>

          <aside className="lv2-aside">
            <section><span>Key takeaway</span><p>{activeSection?.takeaway||activeSection?.example?.demonstrates||topic.summary}</p></section>
            <section><span>Check your understanding</span><p>{topic.recall?.[0]?.[0]||depth?.analysis?.[0]||'Can you explain the main idea without rereading it?'}</p></section>
            <section className="lv2-confidence"><span>How secure is this topic?</span><div><button disabled={busyStatus} className={currentStatus==='needs_review'?'active review':''} onClick={()=>setStatus('needs_review')}>Need another look</button><button disabled={busyStatus} className={['developing','getting_there'].includes(currentStatus)?'active developing':''} onClick={()=>setStatus('developing')}>Getting there</button><button disabled={busyStatus} className={currentStatus==='confident'?'active confident':''} onClick={()=>setStatus('confident')}>Confident</button></div></section>
          </aside>
        </div>}

        {tool==='resources'&&<section className="lv2-tool-panel"><div className="lv2-tool-head"><FolderOpen/><div><span>Resources</span><h3>Use the source you need, not every source at once</h3></div></div><div className="lv2-resource-actions"><button onClick={()=>go?.('library')}><FolderOpen/><span><strong>My Library</strong><small>Teacher handouts, screenshots, PDFs and notes</small></span></button><a href={links.guide} target="_blank" rel="noreferrer"><FileText/><span><strong>Full study guide</strong><small>Longer subject reference</small></span><ExternalLink/></a><a href={links.wjec} target="_blank" rel="noreferrer"><Scale/><span><strong>Official WJEC</strong><small>Specification and assessment information</small></span><ExternalLink/></a></div></section>}

        {tool==='practise'&&<section className="lv2-tool-panel"><div className="lv2-tool-head"><Target/><div><span>Practise</span><h3>Retrieve first, then use practice mode</h3></div></div><div className="lv2-mini-recall">{(topic.recall||[]).slice(0,3).map(([q,a],index)=><article key={q}><strong>{index+1}. {q}</strong>{revealed[`tool-${index}`]?<p>{a}</p>:<button onClick={()=>setRevealed(v=>({...v,[`tool-${index}`]:true}))}>Reveal after I try</button>}</article>)}</div><button className="lv2-primary" onClick={()=>go?.('practice')}>Open Mock & Practice <ChevronRight/></button><p className="lv2-integrity"><CheckCircle2/>Practice is separate from live school assessment. The Hub gives learning feedback without writing Kellyn’s school submission.</p></section>}

        {tool==='ask'&&<LearningCoachPanel subjects={subjects} subjectSlug={subjectSlug} unit={unit} topic={topic} section={activeSection} knowledgeContext={knowledgeContext} notify={notify}/>} 

        {tool==='plan'&&<section className="lv2-tool-panel"><div className="lv2-tool-head"><CalendarDays/><div><span>Plan</span><h3>Connect learning to what is actually coming up</h3></div></div>{relatedTasks.length?<div className="lv2-task-list">{relatedTasks.slice(0,3).map(task=><article key={task.id}><strong>{task.title}</strong><span>{task.next_action||'Open My Work to choose the next action.'}</span></article>)}</div>:<p className="lv2-calm-empty">No open {subjectName} task is currently linked here.</p>}<div className="lv2-plan-actions"><button onClick={()=>go?.('work')}>My Work</button><button onClick={()=>go?.('planner')}>Planner</button></div></section>}

        <footer className="lv2-footer"><button disabled={!previous} onClick={()=>goTopic(previous)}><ChevronLeft/>Previous topic</button><span>{currentFlatIndex+1} of {flatTopics.length} in {subjectName}</span><button disabled={!next} onClick={()=>goTopic(next)}>Next topic<ChevronRight/></button></footer>
      </main>
    </div>
  </div>
}
