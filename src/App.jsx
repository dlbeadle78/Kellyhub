import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Accessibility, BarChart3, BookOpen, Bus, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, CloudUpload, GraduationCap, HelpCircle, Home, Lightbulb, LogOut,
  Menu, Mic2, Moon, NotebookTabs, Plus, Search, Settings2, Sparkles, Target,
  Upload, UserRound, Volume2, X, FileText, University, Brain, ShieldCheck
} from 'lucide-react'
import { supabase } from './supabase.js'
import LearningSubjectsPage from './LearningSubjects.jsx'
import SpeechControls from './SpeechControls.jsx'
import Phase1Work from './Phase1Work.jsx'
import QuickCaptureV2 from './QuickCaptureV2.jsx'

const NAV = [
  ['today', 'Today', Home],
  ['subjects', 'Subjects', BookOpen],
  ['work', 'My Work', ClipboardList],
  ['planner', 'Planner', CalendarDays],
  ['practice', 'Mock & Practice', Brain],
  ['ucas', 'UCAS', GraduationCap],
  ['uni', 'University', University],
  ['progress', 'My Progress', BarChart3],
  ['resources', 'Resources & AI', NotebookTabs],
  ['stuck', "I'm Stuck", HelpCircle],
  ['capture', 'Quick Capture', Plus],
]

const SUBJECT_META = {
  sociology: { tone: 'mint', icon: '◉' },
  law: { tone: 'peach', icon: '⚖' },
  history: { tone: 'blue', icon: '⌂' },
  'welsh-bacc': { tone: 'lilac', icon: '★' },
}

const STATUS_LABEL = {
  not_started: 'Not started',
  started: 'Started',
  nearly_finished: 'Nearly finished',
  feedback: 'Feedback',
  completed: 'Completed',
}

const SAFE_STEPS = [
  'Read the task or brief and identify what it is asking.',
  'Gather the relevant notes, sources or teacher guidance.',
  'Make a simple plan in your own words.',
  'Complete the first section yourself.',
  'Continue one section at a time.',
  'Review your work against the instructions.',
  'Check spelling, references and presentation.',
  'Submit or take the next agreed action.',
]

const NOTEBOOK_PROMPTS = {
  explain: 'Explain this topic in clear, simple language. Use short sections and define key terms. Do not write assessed work for me.',
  quiz: 'Quiz me on this topic one question at a time. Wait for my answer, then explain what I got right or need to revisit.',
  audio: 'Create an audio overview plan for this topic, focusing on the key ideas I need to understand and recall.',
  revise: 'Help me make a revision plan for this topic using recall, short practice and spaced review. Do not write assessed answers.',
}

function timetableWeekForDate(value = new Date()) {
  const anchor = new Date(2026, 7, 31)
  anchor.setHours(0,0,0,0)
  const current = new Date(value)
  current.setHours(0,0,0,0)
  const weekIndex = Math.floor((current - anchor) / 604800000)
  return (((weekIndex % 2) + 2) % 2) + 1
}

function classNames(...items) { return items.filter(Boolean).join(' ') }
function fmtDate(value) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value))
}
function fmtDateLong(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value))
}
function fmtTime(value) {
  if (!value) return ''
  if (value.includes('T')) return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  return value.slice(0, 5)
}
function dueInDays(value) {
  if (!value) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const due = new Date(value); due.setHours(0,0,0,0)
  return Math.ceil((due - now) / 86400000)
}
function byDue(a, b) {
  if (!a.due_at && !b.due_at) return a.created_at.localeCompare(b.created_at)
  if (!a.due_at) return 1
  if (!b.due_at) return -1
  return new Date(a.due_at) - new Date(b.due_at)
}
function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = 0.92
  window.speechSynthesis.speak(utterance)
}
function copyText(text) { navigator.clipboard?.writeText(text) }

function Button({ children, variant='primary', className='', ...props }) {
  return <button className={classNames('btn', `btn-${variant}`, className)} {...props}>{children}</button>
}
function Card({ children, className='', tone='' }) {
  return <section className={classNames('card', tone && `card-${tone}`, className)}>{children}</section>
}
function Empty({ children }) { return <div className="empty">{children}</div> }
function Progress({ value=0 }) { return <div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('')
    const action = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { data: { display_name: 'Kellyn' } } })
    const { error } = await action
    setBusy(false)
    if (error) return setMessage(error.message)
    if (mode === 'signup') setMessage('Account created. Check your email if confirmation is required, then sign in.')
  }

  return <div className="auth-shell">
    <div className="auth-brand">
      <div className="brand-mark">K</div>
      <div><h1>Kellyn Hub</h1><p>Plan. Understand. Achieve.</p></div>
    </div>
    <Card className="auth-card">
      <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      <p className="muted">Your tasks, files and progress are private and stored securely.</p>
      <form onSubmit={submit} className="stack">
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength="8" autoComplete={mode==='login'?'current-password':'new-password'} /></label>
        {message && <div className="notice">{message}</div>}
        <Button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      </form>
      <button className="text-link" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>
        {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
      </button>
    </Card>
  </div>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState(location.hash.replace('#/','') || 'today')
  const [mobileNav, setMobileNav] = useState(false)
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [steps, setSteps] = useState([])
  const [events, setEvents] = useState([])
  const [timetable, setTimetable] = useState([])
  const [travel, setTravel] = useState([])
  const [evidence, setEvidence] = useState([])
  const [universities, setUniversities] = useState([])
  const [practice, setPractice] = useState([])
  const [skills, setSkills] = useState([])
  const [captures, setCaptures] = useState([])
  const [files, setFiles] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState('')
  const mainRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    const onHash = () => setRoute(location.hash.replace('#/','') || 'today')
    window.addEventListener('hashchange', onHash)
    return () => { sub.subscription.unsubscribe(); window.removeEventListener('hashchange', onHash) }
  }, [])

  useEffect(() => { if (session?.user) loadAll() }, [session?.user?.id])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.dark = profile?.dark_mode ? 'true' : 'false'
    root.dataset.dyslexic = profile?.dyslexic_font ? 'true' : 'false'
    root.style.setProperty('--text-scale', String(profile?.text_scale || 1))
    root.dataset.reducedMotion = profile?.reduced_motion ? 'true' : 'false'
  }, [profile])

  async function loadAll() {
    if (!session?.user) return
    setRefreshing(true)
    const uid = session.user.id
    const requests = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('subjects').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false }),
      supabase.from('task_steps').select('*').order('order_index'),
      supabase.from('planner_events').select('*').order('starts_at'),
      supabase.from('timetable_entries').select('*').order('day_of_week').order('start_time'),
      supabase.from('travel_entries').select('*').eq('active', true).order('direction').order('sequence'),
      supabase.from('evidence_bank').select('*').order('event_date', { ascending: false, nullsFirst: false }),
      supabase.from('university_choices').select('*').order('favourite', { ascending: false }).order('university_name'),
      supabase.from('practice_records').select('*').order('completed_at', { ascending: false }),
      supabase.from('independent_skills').select('*').order('category').order('skill'),
      supabase.from('quick_capture').select('*').order('created_at', { ascending: false }),
      supabase.from('user_files').select('*').order('created_at', { ascending: false }),
    ])
    const errors = requests.filter(r=>r.error).map(r=>r.error.message)
    if (errors.length) notify(errors[0])
    setProfile(requests[0].data)
    setSubjects(requests[1].data || [])
    setTasks(requests[2].data || [])
    setSteps(requests[3].data || [])
    setEvents(requests[4].data || [])
    setTimetable(requests[5].data || [])
    setTravel(requests[6].data || [])
    setEvidence(requests[7].data || [])
    setUniversities(requests[8].data || [])
    setPractice(requests[9].data || [])
    setSkills(requests[10].data || [])
    setCaptures(requests[11].data || [])
    setFiles(requests[12].data || [])
    setRefreshing(false)
  }

  function notify(message) { setToast(message); window.setTimeout(()=>setToast(''), 3200) }
  function go(next) { location.hash = `#/${next}`; setMobileNav(false) }
  async function updateProfile(patch) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select().single()
    if (error) return notify(error.message)
    setProfile(data)
  }
  async function signOut() { await supabase.auth.signOut() }

  if (loading) return <div className="loading-screen">Loading Kellyn Hub…</div>
  if (!session) return <AuthScreen />

  const pageTitle = NAV.find(([key])=>key===route)?.[1] || 'Kellyn Hub'

  return <div className="app-shell">
    <aside className={classNames('sidebar', mobileNav && 'sidebar-open')}>
      <div className="sidebar-head">
        <button className="close-mobile" onClick={()=>setMobileNav(false)} aria-label="Close menu"><X /></button>
        <div className="brand-row"><div className="brand-mark small">K</div><div><strong>Kellyn Hub</strong><small>Plan. Understand. Achieve.</small></div></div>
      </div>
      <nav aria-label="Main navigation">
        {NAV.map(([key,label,Icon]) => <button key={key} className={classNames('nav-item', route===key && 'active', key==='stuck' && 'stuck-nav')} onClick={()=>go(key)}><Icon size={20}/><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={()=>go('settings')}><Settings2 size={20}/><span>Accessibility</span></button>
        <div className="encouragement"><Sparkles size={18}/><span>One step at a time.</span></div>
        <button className="nav-item" onClick={signOut}><LogOut size={20}/><span>Sign out</span></button>
      </div>
    </aside>

    <div className="content-shell">
      <header className="topbar">
        <button className="menu-btn" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu /></button>
        <div><h1>{pageTitle}</h1><p>{route==='today' ? `${fmtDateLong(new Date())}` : 'Kellyn Hub'}</p></div>
        <div className="top-actions">
          <button title="Text size" onClick={()=>updateProfile({ text_scale: profile?.text_scale >= 1.2 ? 1 : Number(((profile?.text_scale || 1)+0.1).toFixed(1)) })}><span className="aa">A<span>A</span></span><small>Text size</small></button>
          <SpeechControls compact getText={()=>mainRef.current?.innerText || ''} label="Read aloud" />
          <button title="Focus mode" onClick={()=>document.body.classList.toggle('focus-app')}><Target/><small>Focus mode</small></button>
          <button title="Dark mode" onClick={()=>updateProfile({ dark_mode: !profile?.dark_mode })}><Moon/><small>Dark mode</small></button>
        </div>
      </header>

      <main ref={mainRef} className="main-content" tabIndex="-1">
        {route==='today' && <TodayPage {...common()} />}
        {route==='subjects' && <LearningSubjectsPage {...common()} />}
        {route==='work' && <Phase1Work {...common()} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} />}
        {route==='planner' && <PlannerPage {...common()} />}
        {route==='practice' && <PracticePage {...common()} />}
        {route==='ucas' && <UcasPage {...common()} />}
        {route==='uni' && <UniversityPage {...common()} />}
        {route==='progress' && <ProgressPage {...common()} />}
        {route==='resources' && <ResourcesPage {...common()} />}
        {route==='stuck' && <StuckPage {...common()} />}
        {route==='capture' && <QuickCaptureV2 {...common()} />}
        {route==='settings' && <SettingsPage {...common()} />}
      </main>
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>

  function common() {
    return { session, profile, subjects, tasks, steps, events, timetable, travel, evidence, universities, practice, skills, captures, files, loadAll, notify, go, updateProfile, refreshing }
  }
}

function TodayPage({ profile, subjects, tasks, timetable, travel, practice, skills, go }) {
  const todayIndex = ((new Date().getDay() + 6) % 7) + 1
  const currentWeek = timetableWeekForDate(new Date())
  const todayLessons = timetable.filter(x=>x.day_of_week===todayIndex && (x.week_number || 1)===currentWeek)
  const activeTasks = [...tasks].filter(t=>t.status!=='completed').sort(byDue)
  const top3 = activeTasks.slice(0,3)
  const focus = top3[0]
  const upcoming = activeTasks.filter(t=>t.due_at).slice(0,4)
  const toSchool = travel.filter(x=>x.direction==='to_school')
  const fromSchool = travel.filter(x=>x.direction==='from_school')
  const completed = tasks.filter(t=>t.status==='completed').length
  const taskProgress = tasks.length ? Math.round(completed/tasks.length*100) : 0
  const skillProgress = skills.length ? Math.round(skills.filter(s=>s.status==='confident').length/skills.length*100) : 0
  return <div className="stack-lg">
    <div className="welcome"><div><h2>Good {new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, {profile?.display_name || 'Kellyn'}</h2><p>This is your space to stay organised, understand what is important and take control of your next steps.</p></div></div>

    <div className="grid-3">
      <Card><div className="card-title"><CalendarDays/>Today at a glance</div>{todayLessons.length ? <div className="timeline compact">{todayLessons.map(x=><div key={x.id}><time>{fmtTime(x.start_time)}</time><span>{x.label}</span></div>)}</div> : <Empty>Your timetable is ready to be added in Planner.</Empty>}<button className="text-link" onClick={()=>go('planner')}>See full timetable <ChevronRight size={15}/></button></Card>
      <Card tone="mint"><div className="card-title"><Bus/>Bus & travel</div>{toSchool.length || fromSchool.length ? <div className="travel-mini">{[toSchool[0],fromSchool[0]].filter(Boolean).map(x=><div key={x.id}><strong>{x.depart_time ? fmtTime(x.depart_time) : 'Journey'}</strong><span>{x.origin} → {x.destination}</span><small>{x.service || ''}</small></div>)}</div> : <Empty>Add the confirmed school journey in Planner.</Empty>}<button className="text-link" onClick={()=>go('planner')}>Manage travel <ChevronRight size={15}/></button></Card>
      <Card tone="lilac"><div className="card-title"><ClipboardList/>Your next 3 actions</div>{top3.length ? top3.map((t,i)=><button key={t.id} className="action-row" onClick={()=>go('work')}><span className="number-dot">{i+1}</span><span><strong>{t.title}</strong><small>{t.subject_slug || 'General'} · {t.estimated_minutes ? `${t.estimated_minutes} mins` : 'Set a time'}</small></span></button>) : <Empty>Add a task and your next actions will appear here.</Empty>}</Card>
    </div>

    <div className="subject-grid">{subjects.map(subject => {
      const related=tasks.filter(t=>t.subject_slug===subject.slug); const done=related.filter(t=>t.status==='completed').length; const pct=related.length?Math.round(done/related.length*100):0
      return <Card key={subject.id} className={`subject-card ${SUBJECT_META[subject.slug]?.tone||''}`}><div className="subject-heading"><span className="subject-icon">{SUBJECT_META[subject.slug]?.icon}</span><h3>{subject.short_name}</h3></div><div className="progress-label"><span>Progress</span><strong>{pct}%</strong></div><Progress value={pct}/><p className="tiny">Year 13 focus: {subject.year13_priority}</p><Button variant="soft" onClick={()=>go('subjects')}>View subject</Button></Card>
    })}</div>

    <div className="grid-3">
      <Card tone="yellow"><div className="card-title"><Lightbulb/>What should I do now?</div>{focus ? <><p>Based on your open work, start with:</p><div className="focus-task"><strong>{focus.title}</strong><span>{focus.next_action || 'Read the task and choose the first step.'}</span>{focus.due_at && <small>Due {fmtDate(focus.due_at)}</small>}</div><Button onClick={()=>go('work')}>Start this task</Button></> : <Empty>You are clear for now. Add work when you receive it.</Empty>}</Card>
      <Card tone="rose"><div className="card-title"><CalendarDays/>Upcoming deadlines</div>{upcoming.length ? upcoming.map(t=><div className="deadline-row" key={t.id}><span className="date-chip">{fmtDate(t.due_at)}</span><span><strong>{t.title}</strong><small>{t.subject_slug}</small></span></div>) : <Empty>No dated deadlines yet.</Empty>}<button className="text-link" onClick={()=>go('work')}>View all deadlines <ChevronRight size={15}/></button></Card>
      <Card tone="blue"><div className="card-title"><BarChart3/>My progress</div><div className="metric"><span>Task completion</span><strong>{taskProgress}%</strong></div><Progress value={taskProgress}/><div className="metric"><span>Independent living</span><strong>{skillProgress}%</strong></div><Progress value={skillProgress}/><div className="metric"><span>Practice records</span><strong>{practice.length}</strong></div><button className="text-link" onClick={()=>go('progress')}>Go to My Progress <ChevronRight size={15}/></button></Card>
    </div>
  </div>
}

function SubjectsPage({ subjects, tasks, practice, go }) {
  const [selected, setSelected] = useState(subjects[0]?.slug || null)
  const subject = subjects.find(s=>s.slug===selected) || subjects[0]
  if (!subject) return <Empty>Subjects are loading.</Empty>
  const relatedTasks = tasks.filter(t=>t.subject_slug===subject.slug)
  const subjectPractice = practice.filter(p=>p.subject_slug===subject.slug)
  const pct = relatedTasks.length ? Math.round(relatedTasks.filter(t=>t.status==='completed').length / relatedTasks.length * 100) : 0
  const resourceUrl = `https://github.com/dlbeadle78/kellynwjec/blob/main/${subject.resource_path}`
  return <div className="stack-lg">
    <div className="segmented">{subjects.map(s=><button key={s.slug} className={selected===s.slug?'active':''} onClick={()=>setSelected(s.slug)}>{s.short_name}</button>)}</div>
    <div className="page-heading"><div className={`round-icon ${SUBJECT_META[subject.slug]?.tone||''}`}>{SUBJECT_META[subject.slug]?.icon}</div><div><h2>{subject.short_name}</h2><p>{subject.name}</p></div><div className="heading-progress"><span>Your progress</span><Progress value={pct}/><strong>{pct}%</strong></div></div>

    <div className="learn-grid">
      <Card tone="mint"><div className="big-action-icon"><BookOpen/></div><h3>Learn</h3><p>Use official resources, notes and explanations to build understanding.</p><a className="btn btn-mint" href={resourceUrl} target="_blank" rel="noreferrer">Open Learn</a></Card>
      <Card tone="lilac"><div className="big-action-icon"><Mic2/></div><h3>Listen</h3><p>Use Read Aloud or create a NotebookLM audio overview prompt.</p><Button variant="lilac" onClick={()=>copyText(NOTEBOOK_PROMPTS.audio)}>Copy audio prompt</Button></Card>
      <Card tone="blue"><div className="big-action-icon"><FileText/></div><h3>Practise</h3><p>Complete your own practice questions and record the result.</p><Button variant="blue" onClick={()=>go('practice')}>Start practice</Button></Card>
      <Card tone="yellow"><div className="big-action-icon"><CheckCircle2/></div><h3>Check</h3><p>Test recall and identify what needs another look.</p><Button variant="yellow" onClick={()=>copyText(NOTEBOOK_PROMPTS.quiz)}>Copy quiz prompt</Button></Card>
    </div>

    <div className="grid-3">
      <Card><div className="card-title"><CalendarDays/>This week</div>{relatedTasks.filter(t=>t.status!=='completed').slice(0,5).map(t=><div className="check-row" key={t.id}><span className="fake-check"/><span>{t.title}</span><small>{fmtDate(t.due_at)}</small></div>)}{!relatedTasks.length&&<Empty>No tasks yet for this subject.</Empty>}<button className="text-link" onClick={()=>go('work')}>View My Work <ChevronRight size={15}/></button></Card>
      <Card tone="rose"><div className="card-title"><HelpCircle/>I don’t understand this</div><p>Use a simpler explanation, a worked method or a short question sequence. The Hub supports learning, not assessed answers.</p><Button variant="danger" onClick={()=>go('stuck')}>Get help</Button></Card>
      <Card tone="blue"><div className="card-title"><Sparkles/>NotebookLM companion</div><PromptButton label="Explain this topic simply" prompt={NOTEBOOK_PROMPTS.explain}/><PromptButton label="Quiz me on this topic" prompt={NOTEBOOK_PROMPTS.quiz}/><PromptButton label="Make a revision plan" prompt={NOTEBOOK_PROMPTS.revise}/></Card>
    </div>

    <div className="grid-2">
      <Card tone="yellow"><div className="card-title"><Lightbulb/>Year 13 priority</div><p>{subject.year13_priority}</p><a className="text-link" href={resourceUrl} target="_blank" rel="noreferrer">Open WJEC resource library <ChevronRight size={15}/></a></Card>
      <Card><div className="card-title"><BarChart3/>Practice record</div><div className="metric"><span>Practice completed</span><strong>{subjectPractice.length}</strong></div>{subjectPractice.slice(0,3).map(p=><div className="simple-row" key={p.id}><span>{p.title}</span><small>{p.score!=null ? `${p.score}${p.score_out_of?`/${p.score_out_of}`:''}` : fmtDate(p.completed_at)}</small></div>)}</Card>
    </div>
  </div>
}

function PromptButton({label,prompt}) { const [copied,setCopied]=useState(false); return <button className="prompt-button" onClick={()=>{copyText(prompt);setCopied(true);setTimeout(()=>setCopied(false),1200)}}><Sparkles size={17}/><span>{label}<small>{copied?'Copied':'Copy safe prompt'}</small></span></button> }

function WorkPage({ session, subjects, tasks, steps, files, loadAll, notify, selectedTaskId, setSelectedTaskId }) {
  const [filter,setFilter]=useState('all')
  const [showAdd,setShowAdd]=useState(false)
  const selected=tasks.find(t=>t.id===selectedTaskId) || tasks[0]
  const visible=filter==='all'?tasks:tasks.filter(t=>t.status===filter)
  const [uploading,setUploading]=useState(false)

  async function addTask(e) {
    e.preventDefault(); const fd=new FormData(e.currentTarget)
    const payload={ user_id:session.user.id,title:fd.get('title'),subject_slug:fd.get('subject')||null,due_at:fd.get('due')?new Date(fd.get('due')).toISOString():null,estimated_minutes:fd.get('minutes')?Number(fd.get('minutes')):null,assessed:fd.get('assessed')==='on',next_action:'Read the task and identify what it is asking.' }
    const {data,error}=await supabase.from('tasks').insert(payload).select().single(); if(error)return notify(error.message)
    await supabase.from('task_steps').insert(SAFE_STEPS.map((title,i)=>({task_id:data.id,user_id:session.user.id,title,order_index:i,estimated_minutes:i===0?10:null})))
    setShowAdd(false); e.currentTarget.reset(); setSelectedTaskId(data.id); await loadAll(); notify('Task added and broken into safe steps.')
  }
  async function toggleStep(step) {
    const completed=!step.completed
    const {error}=await supabase.from('task_steps').update({completed,completed_at:completed?new Date().toISOString():null}).eq('id',step.id); if(error)return notify(error.message); await loadAll()
  }
  async function setStatus(task,status) { const {error}=await supabase.from('tasks').update({status}).eq('id',task.id); if(error)return notify(error.message); await loadAll() }
  async function upload(e) {
    const file=e.target.files?.[0]; if(!file)return; setUploading(true)
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'); const path=`${session.user.id}/${crypto.randomUUID()}-${safe}`
    const {error:uploadError}=await supabase.storage.from('user-files').upload(path,file); if(uploadError){setUploading(false);return notify(uploadError.message)}
    const {error}=await supabase.from('user_files').insert({user_id:session.user.id,task_id:selected?.id||null,subject_slug:selected?.subject_slug||null,storage_path:path,original_name:file.name,mime_type:file.type,size_bytes:file.size,file_type:'other'})
    setUploading(false); if(error)return notify(error.message); await loadAll(); notify('File uploaded securely.')
  }
  const selectedSteps=selected?steps.filter(s=>s.task_id===selected.id):[]
  const selectedFiles=selected?files.filter(f=>f.task_id===selected.id):[]
  return <div className="stack-lg">
    <div className="work-top-grid">
      <Card><div className="card-title"><CloudUpload/>Upload your work</div><label className="upload-zone"><Upload/><strong>{uploading?'Uploading…':'Choose a file'}</strong><span>PDF, Word, PowerPoint, images and screenshots</span><input type="file" onChange={upload} disabled={uploading}/></label><p className="tiny">Files are private. Select a task first if you want the upload linked to it.</p></Card>
      <Card tone="yellow"><div className="card-title"><ShieldCheck/>Academic integrity</div><p>Kellyn Hub helps you understand, plan and check your work.</p><strong>It does not write assessed answers for you.</strong><p className="tiny">Your ideas. Your words. Your learning.</p></Card>
      <Card tone="blue"><div className="card-title"><Lightbulb/>What should I do first?</div>{tasks.filter(t=>t.status!=='completed').sort(byDue)[0] ? <div className="focus-task"><strong>{tasks.filter(t=>t.status!=='completed').sort(byDue)[0].title}</strong><span>{tasks.filter(t=>t.status!=='completed').sort(byDue)[0].next_action}</span></div>:<Empty>No open tasks.</Empty>}</Card>
    </div>

    <div className="work-layout">
      <Card className="work-list-card">
        <div className="card-header-row"><div><h2>My work queue</h2><p className="muted">All tasks in one place</p></div><Button onClick={()=>setShowAdd(!showAdd)}><Plus size={17}/> Add task</Button></div>
        {showAdd&&<form className="add-form" onSubmit={addTask}><input name="title" placeholder="Task title" required/><select name="subject"><option value="">General</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select><input name="due" type="date"/><input name="minutes" type="number" min="1" placeholder="Minutes"/><label className="inline-check"><input name="assessed" type="checkbox"/> Assessed work</label><Button>Add task</Button></form>}
        <div className="tabs">{['all','not_started','started','nearly_finished','feedback','completed'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x==='all'?'All':STATUS_LABEL[x]}</button>)}</div>
        <div className="task-table">{visible.map(t=><button key={t.id} className={classNames('task-row',selected?.id===t.id&&'selected')} onClick={()=>setSelectedTaskId(t.id)}><span className="task-main"><strong>{t.title}</strong><small>{t.subject_slug||'General'}</small></span><span>{fmtDate(t.due_at)}<small>{t.due_at&&dueInDays(t.due_at)!=null?`${dueInDays(t.due_at)} days`:''}</small></span><span className={`status status-${t.status}`}>{STATUS_LABEL[t.status]}</span><span>{t.next_action||'Choose next action'}</span><ChevronRight size={18}/></button>)}{!visible.length&&<Empty>No tasks in this view.</Empty>}</div>
      </Card>

      <Card className="task-detail">
        {selected ? <><div className="task-detail-head"><div><span className={`status status-${selected.status}`}>{STATUS_LABEL[selected.status]}</span><h2>{selected.title}</h2><p>{selected.subject_slug||'General'} {selected.due_at&&`· Due ${fmtDateLong(selected.due_at)}`}</p></div></div>
        {selected.assessed&&<div className="integrity-strip"><ShieldCheck size={18}/>This is assessed work. The Hub can organise and explain the task, but the response must be Kellyn’s own work.</div>}
        <h3>Break it into small steps</h3><div className="step-list">{selectedSteps.map((s,i)=><label key={s.id} className={classNames('step-row',s.completed&&'done')}><span className="step-num">{i+1}</span><span>{s.title}{s.estimated_minutes&&<small>{s.estimated_minutes} mins</small>}</span><input type="checkbox" checked={s.completed} onChange={()=>toggleStep(s)}/></label>)}</div>
        <div className="button-row"><Button variant="soft" onClick={()=>speak(selectedSteps.find(s=>!s.completed)?.title||selected.title)}><Volume2 size={17}/> Read next step</Button><select value={selected.status} onChange={e=>setStatus(selected,e.target.value)}>{Object.entries(STATUS_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        {selectedFiles.length>0&&<><h3>Files</h3>{selectedFiles.map(f=><div className="simple-row" key={f.id}><FileText size={17}/><span>{f.original_name}</span><small>{Math.round((f.size_bytes||0)/1024)} KB</small></div>)}</>}
        </> : <Empty>Select a task to see its steps.</Empty>}
      </Card>
    </div>
  </div>
}

function PlannerPage({ session, subjects, events, timetable, travel, loadAll, notify }) {
  const [tab,setTab]=useState('week')
  const currentWeek=timetableWeekForDate(new Date())
  async function addEvent(e){e.preventDefault();const fd=new FormData(e.currentTarget);const start=new Date(fd.get('start')).toISOString();const {error}=await supabase.from('planner_events').insert({user_id:session.user.id,title:fd.get('title'),category:fd.get('category'),subject_slug:fd.get('subject')||null,starts_at:start,location:fd.get('location')||null});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Planner event added.')}
  async function addTimetable(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('timetable_entries').insert({user_id:session.user.id,week_number:currentWeek,day_of_week:Number(fd.get('day')),start_time:fd.get('start'),end_time:fd.get('end'),label:fd.get('label'),subject_slug:fd.get('subject')||null,entry_type:fd.get('type')});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Timetable entry added.')}
  async function addTravel(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('travel_entries').insert({user_id:session.user.id,direction:fd.get('direction'),sequence:Number(fd.get('sequence')||1),depart_time:fd.get('depart')||null,arrive_time:fd.get('arrive')||null,origin:fd.get('origin'),destination:fd.get('destination'),service:fd.get('service')||null});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Travel step added.')}
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday']
  return <div className="stack-lg">
    <div className="tabs big"><button className={tab==='week'?'active':''} onClick={()=>setTab('week')}>Week {currentWeek}</button><button className={tab==='events'?'active':''} onClick={()=>setTab('events')}>Events</button><button className={tab==='setup'?'active':''} onClick={()=>setTab('setup')}>Set up timetable & travel</button></div>
    {tab==='week'&&<div className="week-grid">{days.map((day,i)=><Card key={day}><h3>{day}</h3>{timetable.filter(x=>x.day_of_week===i+1&&(x.week_number||1)===currentWeek).map(x=><div className={`calendar-block ${SUBJECT_META[x.subject_slug]?.tone||''}`} key={x.id}><strong>{fmtTime(x.start_time)}</strong><span>{x.label}</span></div>)}{!timetable.some(x=>x.day_of_week===i+1&&(x.week_number||1)===currentWeek)&&<span className="muted">No entries</span>}</Card>)}</div>}
    {tab==='events'&&<div className="grid-2"><Card><h2>Upcoming events</h2>{events.filter(e=>new Date(e.starts_at)>=new Date()).slice(0,20).map(e=><div className="deadline-row" key={e.id}><span className="date-chip">{fmtDate(e.starts_at)}</span><span><strong>{e.title}</strong><small>{fmtTime(e.starts_at)} · {e.category}</small></span></div>)}{!events.length&&<Empty>No events yet.</Empty>}</Card><Card><h2>Add event</h2><form onSubmit={addEvent} className="stack"><input name="title" placeholder="Event title" required/><input type="datetime-local" name="start" required/><select name="category"><option value="school">School</option><option value="work">My Work</option><option value="revision">Revision</option><option value="activity">Activity</option><option value="ucas">UCAS</option><option value="university">University</option><option value="personal">Personal</option></select><select name="subject"><option value="">No subject</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select><input name="location" placeholder="Location (optional)"/><Button>Add event</Button></form></Card></div>}
    {tab==='setup'&&<div className="grid-2"><Card><h2>Add timetable entry</h2><p className="muted">Use Kellyn’s confirmed school timetable. Do not guess missing lessons or rooms.</p><form onSubmit={addTimetable} className="stack"><select name="day">{days.map((d,i)=><option key={d} value={i+1}>{d}</option>)}</select><div className="form-two"><input type="time" name="start" required/><input type="time" name="end" required/></div><input name="label" placeholder="Lesson or activity" required/><select name="subject"><option value="">No subject</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select><select name="type"><option value="lesson">Lesson</option><option value="registration">Registration</option><option value="free">Free period</option><option value="break">Break</option><option value="lunch">Lunch</option><option value="other">Other</option></select><Button>Add timetable entry</Button></form></Card>
    <Card><h2>Add travel step</h2><p className="muted">Add each leg of the confirmed school journey in sequence.</p><form onSubmit={addTravel} className="stack"><select name="direction"><option value="to_school">To school</option><option value="from_school">From school</option><option value="other">Other</option></select><input type="number" name="sequence" min="1" defaultValue="1"/><div className="form-two"><input type="time" name="depart"/><input type="time" name="arrive"/></div><input name="origin" placeholder="Origin" required/><input name="destination" placeholder="Destination" required/><input name="service" placeholder="Bus/service e.g. 404"/><Button>Add travel step</Button></form>{travel.slice(0,8).map(x=><div className="simple-row" key={x.id}><Bus size={17}/><span>{x.origin} → {x.destination}</span><small>{x.service||''}</small></div>)}</Card></div>}
  </div>
}

function PracticePage({ session, subjects, practice, loadAll, notify }) {
  async function add(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('practice_records').insert({user_id:session.user.id,subject_slug:fd.get('subject')||null,title:fd.get('title'),practice_type:fd.get('type'),score:fd.get('score')?Number(fd.get('score')):null,score_out_of:fd.get('outof')?Number(fd.get('outof')):null,reflection:fd.get('reflection')||null});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Practice record saved.')}
  return <div className="grid-2"><Card><div className="integrity-strip"><ShieldCheck size={18}/>This area is for practice. Feedback can support improvement, but assessed schoolwork remains Kellyn’s own work.</div><h2>Practice options</h2>{['20-minute knowledge check','Essay question','Source question','Full mock paper'].map((x,i)=><div className="practice-option" key={x}><CheckCircle2/><span><strong>{x}</strong><small>{['Short answers','Timed practice','Exam-style','Timed assessment'][i]}</small></span></div>)}<h3>Your records</h3>{practice.slice(0,10).map(p=><div className="simple-row" key={p.id}><span>{p.title}<small>{p.subject_slug||'General'}</small></span><strong>{p.score!=null?`${p.score}${p.score_out_of?`/${p.score_out_of}`:''}`:fmtDate(p.completed_at)}</strong></div>)}</Card><Card><h2>Record practice</h2><form onSubmit={add} className="stack"><select name="subject"><option value="">General</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select><input name="title" placeholder="What did you practise?" required/><select name="type"><option value="knowledge_check">Knowledge check</option><option value="essay">Essay practice</option><option value="source_question">Source question</option><option value="mock">Mock</option><option value="recall">Recall</option><option value="other">Other</option></select><div className="form-two"><input name="score" type="number" step="0.01" placeholder="Score"/><input name="outof" type="number" step="0.01" placeholder="Out of"/></div><textarea name="reflection" placeholder="What went well? What needs another look?"/><Button>Save practice</Button></form></Card></div>
}

function UcasPage({ session, evidence, universities, loadAll, notify }) {
  const [tab,setTab]=useState('statement')
  async function addEvidence(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('evidence_bank').insert({user_id:session.user.id,title:fd.get('title'),category:fd.get('category'),event_date:fd.get('date')||null,description:fd.get('description')||null,what_learned:fd.get('learned')||null});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Evidence added.')}
  return <div className="stack-lg"><div className="tabs big"><button className={tab==='statement'?'active':''} onClick={()=>setTab('statement')}>Personal Statement</button><button className={tab==='evidence'?'active':''} onClick={()=>setTab('evidence')}>Evidence Bank</button><button className={tab==='choices'?'active':''} onClick={()=>setTab('choices')}>University Choices</button></div>
    {tab==='statement'&&<div className="ucas-layout"><div className="stack-lg"><div className="integrity-strip purple"><ShieldCheck size={18}/>We support your planning and reflection. We do not write your personal statement for you.</div><Card><div className="current-step"><span className="step-bubble">1</span><div><small>Current step</small><h2>Understand the questions and gather your own evidence</h2><p>Use real experiences and short notes before drafting anything.</p></div></div><div className="grid-2 compact-grid"><div><h3>What to do</h3><ul className="tick-list"><li>Read each UCAS question carefully</li><li>Add real experiences to your evidence bank</li><li>Note what you learned or noticed</li><li>Connect evidence to your course interests</li></ul></div><div><h3>Tiny reflection prompts</h3><div className="prompt-grid"><span>What did you notice?</span><span>What did you learn?</span><span>How did it make you feel?</span><span>How has it shaped your interests?</span></div></div></div></Card><Card><div className="card-header-row"><div><h3>My evidence bank</h3><p className="muted">Real experiences only</p></div><Button variant="soft" onClick={()=>setTab('evidence')}>Add evidence</Button></div><div className="evidence-strip">{evidence.slice(0,5).map(x=><div className="evidence-card" key={x.id}><span className="round-icon tiny"><Sparkles/></span><strong>{x.title}</strong><small>{x.category}</small></div>)}{!evidence.length&&<Empty>Add visits, events, awards, activities or volunteering.</Empty>}</div></Card></div><Card tone="yellow"><h3>Remember</h3><ul className="tick-list"><li>Be honest and be yourself</li><li>Use real examples</li><li>Show your thinking</li><li>Keep it focused</li><li>Check spelling and grammar</li></ul></Card></div>}
    {tab==='evidence'&&<div className="grid-2"><Card><h2>Evidence bank</h2>{evidence.map(x=><div className="evidence-list" key={x.id}><strong>{x.title}</strong><span>{x.category} {x.event_date&&`· ${fmtDate(x.event_date)}`}</span>{x.what_learned&&<p>{x.what_learned}</p>}</div>)}{!evidence.length&&<Empty>No evidence added yet.</Empty>}</Card><Card><h2>Add real evidence</h2><form onSubmit={addEvidence} className="stack"><input name="title" placeholder="Experience or activity" required/><select name="category"><option>Visit / Trip</option><option>Event</option><option>Volunteering</option><option>Extracurricular</option><option>Award</option><option>Course</option><option>Talk</option><option>Other</option></select><input type="date" name="date"/><textarea name="description" placeholder="What happened? Keep this factual."/><textarea name="learned" placeholder="What did you learn, notice or understand better?"/><Button>Add evidence</Button></form></Card></div>}
    {tab==='choices'&&<Card><h2>University choices</h2>{universities.map(u=><div className="uni-row" key={u.id}><University/><span><strong>{u.university_name}</strong><small>{u.course_name||'Course to confirm'} {u.campus&&`· ${u.campus}`}</small></span><span className="status">{u.status}</span></div>)}{!universities.length&&<Empty>Add universities in the University section.</Empty>}</Card>}
  </div>
}

function UniversityPage({ session, universities, loadAll, notify }) {
  async function add(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('university_choices').insert({user_id:session.user.id,university_name:fd.get('name'),course_name:fd.get('course')||null,course_code:fd.get('code')||null,campus:fd.get('campus')||null,status:fd.get('status'),favourite:fd.get('favourite')==='on',notes:fd.get('notes')||null,last_checked_at:new Date().toISOString()});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('University added.')}
  return <div className="grid-2"><Card><h2>University research</h2><p className="muted">Keep visits, course comparisons and current facts together. Refresh changing information before applying.</p>{universities.map(u=><div className="uni-card" key={u.id}><div className="uni-icon"><University/></div><div><h3>{u.university_name}</h3><p>{u.course_name||'Course to confirm'}</p><small>{u.course_code||''} {u.campus&&`· ${u.campus}`}</small>{u.notes&&<p className="tiny">{u.notes}</p>}</div><span className="status">{u.favourite?'Favourite':u.status}</span></div>)}{!universities.length&&<Empty>No university choices stored yet.</Empty>}</Card><Card><h2>Add university</h2><form onSubmit={add} className="stack"><input name="name" placeholder="University name" required/><input name="course" placeholder="Course name"/><div className="form-two"><input name="code" placeholder="Course code"/><input name="campus" placeholder="Campus"/></div><select name="status"><option value="researching">Researching</option><option value="shortlist">Shortlist</option><option value="favourite">Favourite</option><option value="not_for_me">Not for me</option><option value="applied">Applied</option></select><label className="inline-check"><input type="checkbox" name="favourite"/> Mark as favourite</label><textarea name="notes" placeholder="Visit notes, questions or things to confirm"/><Button>Add university</Button></form></Card></div>
}

function ProgressPage({ tasks, subjects, practice, universities, skills }) {
  const taskPct=tasks.length?Math.round(tasks.filter(t=>t.status==='completed').length/tasks.length*100):0
  const skillPct=skills.length?Math.round(skills.filter(s=>s.status==='confident').length/skills.length*100):0
  const ucasPct=Math.min(100,Math.round((universities.filter(u=>['shortlist','favourite','applied'].includes(u.status)).length/5)*50 + (universities.length?15:0)))
  return <div className="stack-lg"><div className="grid-3"><MetricCard title="Task completion" value={taskPct}/><MetricCard title="UCAS preparation" value={ucasPct}/><MetricCard title="Independent living" value={skillPct}/></div><div className="grid-2"><Card><h2>Subject progress</h2>{subjects.map(s=>{const rel=tasks.filter(t=>t.subject_slug===s.slug);const pct=rel.length?Math.round(rel.filter(t=>t.status==='completed').length/rel.length*100):0;return <div className="progress-row" key={s.slug}><span>{s.short_name}</span><Progress value={pct}/><strong>{pct}%</strong></div>})}</Card><Card><h2>Practice</h2><div className="metric"><span>Practice records</span><strong>{practice.length}</strong></div><div className="metric"><span>Mocks recorded</span><strong>{practice.filter(p=>p.practice_type==='mock').length}</strong></div><p className="muted">Progress is based on the activity you record. It is a planning aid, not a prediction of grades.</p></Card></div></div>
}
function MetricCard({title,value}){return <Card><h3>{title}</h3><div className="huge-number">{value}%</div><Progress value={value}/></Card>}

function ResourcesPage({ subjects }) {
  return <div className="stack-lg"><div className="grid-2"><Card><div className="card-title"><BookOpen/>WJEC resource library</div><p>Official WJEC links are organised in the separate Kellyn WJEC repository.</p>{subjects.map(s=><a key={s.slug} className="resource-link" href={`https://github.com/dlbeadle78/kellynwjec/blob/main/${s.resource_path}`} target="_blank" rel="noreferrer"><span>{s.short_name}</span><small>{s.year13_priority}</small><ChevronRight/></a>)}</Card><Card tone="blue"><div className="card-title"><Sparkles/>NotebookLM launch & prompts</div><PromptButton label="Explain simply" prompt={NOTEBOOK_PROMPTS.explain}/><PromptButton label="Quiz me" prompt={NOTEBOOK_PROMPTS.quiz}/><PromptButton label="Audio overview" prompt={NOTEBOOK_PROMPTS.audio}/><PromptButton label="Revision plan" prompt={NOTEBOOK_PROMPTS.revise}/><p className="tiny">Open your relevant NotebookLM notebook separately, then paste the prompt.</p></Card></div><Card tone="lilac"><div className="card-title"><ShieldCheck/>AI rules: support only</div><div className="grid-2"><div><h3>AI can help with</h3><ul className="tick-list"><li>Explaining a topic</li><li>Simplifying instructions</li><li>Planning and organisation</li><li>Quizzing and recall</li><li>Reflection</li><li>Reviewing work Kellyn has already written</li></ul></div><div><h3>AI must not</h3><ul className="cross-list"><li>Write assessed coursework</li><li>Produce a personal statement for submission</li><li>Invent evidence or experiences</li><li>Complete homework for Kellyn</li><li>Replace her own thinking</li></ul></div></div></Card></div>
}

function StuckPage({ tasks, steps, go }) {
  const [choice,setChoice]=useState(null)
  const firstTask=[...tasks].filter(t=>t.status!=='completed').sort(byDue)[0]
  const firstStep=firstTask?steps.filter(s=>s.task_id===firstTask.id&&!s.completed).sort((a,b)=>a.order_index-b.order_index)[0]:null
  const support={
    understand:{title:"I don’t understand this",body:'Start with the task instructions. Read one sentence at a time. Circle or note the command word, subject and required outcome. Use Read Aloud if helpful.',action:'Open My Work'},
    next:{title:"I don’t know what to do next",body:firstTask?`Your next open task is “${firstTask.title}”. ${firstStep?.title||firstTask.next_action||'Open it and choose the first small step.'}`:'There are no open tasks. Add the work you have been given first.',action:'Open My Work'},
    tooMuch:{title:'There is too much to do',body:'Do not try to hold the whole list in your head. Choose one urgent task, hide everything else for 10–20 minutes, then review the list again.',action:'Open next task'},
    start:{title:'Help me start',body:firstStep?`Do only this: ${firstStep.title}`:'Add the task first, then Kellyn Hub will break it into small, safe steps.',action:'Start one step'},
    revise:{title:"I don’t know what to revise",body:'Choose the subject with the nearest lesson, mock or weakest recent practice. Use Learn → Practise → Check rather than rereading everything.',action:'Open Subjects'},
  }
  return <div className="stuck-page"><h2>What do you need help with?</h2><div className="stuck-grid"><button onClick={()=>setChoice('understand')}><HelpCircle/><span>I don’t understand this</span></button><button onClick={()=>setChoice('next')}><Sparkles/><span>I don’t know what to do next</span></button><button onClick={()=>setChoice('tooMuch')}><CloudUpload/><span>There is too much to do</span></button><button onClick={()=>setChoice('start')}><Target/><span>Help me start</span></button><button onClick={()=>setChoice('revise')}><BookOpen/><span>I don’t know what to revise</span></button></div>{choice&&<Card className="support-result"><h2>{support[choice].title}</h2><p>{support[choice].body}</p><div className="button-row"><Button onClick={()=>go(choice==='revise'?'subjects':'work')}>{support[choice].action}</Button><Button variant="soft" onClick={()=>speak(support[choice].body)}><Volume2 size={17}/> Read this</Button></div></Card>}<div className="calm-strip"><Lightbulb/><span>You only need to decide the next useful action. You can come back to the rest later.</span></div></div>
}

function CapturePage({ session, captures, subjects, loadAll, notify }) {
  async function add(e){e.preventDefault();const fd=new FormData(e.currentTarget);const content=fd.get('content');const isUrl=/^https?:\/\//i.test(content);const {error}=await supabase.from('quick_capture').insert({user_id:session.user.id,capture_type:isUrl?'link':'text',title:fd.get('title')||null,content:isUrl?null:content,source_url:isUrl?content:null,subject_slug:fd.get('subject')||null});if(error)return notify(error.message);e.currentTarget.reset();await loadAll();notify('Captured. You can organise it later.')}
  return <div className="grid-2"><Card><h2>Add to Kellyn Hub</h2><p className="muted">Capture it now. Organise it later.</p><form onSubmit={add} className="stack"><input name="title" placeholder="Short title (optional)"/><textarea name="content" placeholder="Type a note or paste a web link" required rows="8"/><select name="subject"><option value="">No subject yet</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select><Button><Plus size={17}/> Save capture</Button></form></Card><Card><h2>Recent captures</h2>{captures.map(c=><div className="capture-row" key={c.id}><span className="round-icon tiny">{c.capture_type==='link'?'↗':'+'}</span><span><strong>{c.title||c.source_url||'Quick note'}</strong><small>{c.subject_slug||'Unsorted'} · {fmtDate(c.created_at)}</small>{c.content&&<p>{c.content}</p>}</span></div>)}{!captures.length&&<Empty>Nothing captured yet.</Empty>}</Card></div>
}

function SettingsPage({ profile, updateProfile, session, skills, loadAll, notify }) {
  async function addSkill(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('independent_skills').upsert({user_id:session.user.id,category:fd.get('category'),skill:fd.get('skill'),status:'to_learn'},{onConflict:'user_id,category,skill'});if(error)return notify(error.message);e.currentTarget.reset();await loadAll()}
  async function cycleSkill(skill){const next=skill.status==='to_learn'?'practising':skill.status==='practising'?'confident':'to_learn';const {error}=await supabase.from('independent_skills').update({status:next,updated_at:new Date().toISOString()}).eq('id',skill.id);if(error)return notify(error.message);await loadAll()}
  return <div className="grid-2"><Card><div className="card-title"><Accessibility/>Accessibility</div><label className="setting-row"><span><strong>OpenDyslexic</strong><small>Use the dyslexia-friendly font across the Hub</small></span><input type="checkbox" checked={!!profile?.dyslexic_font} onChange={e=>updateProfile({dyslexic_font:e.target.checked})}/></label><label className="setting-row"><span><strong>Dark mode</strong><small>Use a dark colour scheme</small></span><input type="checkbox" checked={!!profile?.dark_mode} onChange={e=>updateProfile({dark_mode:e.target.checked})}/></label><label className="setting-row"><span><strong>Reduced motion</strong><small>Reduce animation and movement</small></span><input type="checkbox" checked={!!profile?.reduced_motion} onChange={e=>updateProfile({reduced_motion:e.target.checked})}/></label><div className="setting-row"><span><strong>Text size</strong><small>{Math.round((profile?.text_scale||1)*100)}%</small></span><input type="range" min="0.9" max="1.4" step="0.1" value={profile?.text_scale||1} onChange={e=>updateProfile({text_scale:Number(e.target.value)})}/></div></Card><Card><h2>Independent living skills</h2><form onSubmit={addSkill} className="add-form"><input name="category" placeholder="Category e.g. Cooking" required/><input name="skill" placeholder="Skill" required/><Button>Add</Button></form>{skills.map(s=><button className="skill-row" key={s.id} onClick={()=>cycleSkill(s)}><span><strong>{s.skill}</strong><small>{s.category}</small></span><span className={`status status-${s.status}`}>{s.status.replace('_',' ')}</span></button>)}{!skills.length&&<Empty>Add the practical skills you want to track before university.</Empty>}</Card></div>
}
