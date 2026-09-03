import React, { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, ExternalLink, FileText, Headphones, Lightbulb, RotateCcw, Scale, Target } from 'lucide-react'
import { supabase } from './supabase.js'
import { LEARNING_CONTENT, LEARNING_STATUS } from './learningContent.js'
import { depthFor } from './learningDepth.js'
import SpeechControls from './SpeechControls.jsx'
import './learning.css'
import './learning-depth.css'

const SUBJECT_META = {
  sociology: { tone: 'mint', icon: '◉', label: 'Sociology' },
  law: { tone: 'peach', icon: '⚖', label: 'Law' },
  history: { tone: 'blue', icon: '⌂', label: 'History' },
  'welsh-bacc': { tone: 'lilac', icon: '★', label: 'Welsh Bacc' },
}

const RESOURCE_LINKS = {
  sociology: { wjec: 'https://www.wjec.co.uk/qualifications/sociology-as-a-level/', library: 'https://github.com/dlbeadle78/kellynwjec/tree/main/subjects/sociology' },
  law: { wjec: 'https://www.wjec.co.uk/qualifications/law-as-a-level/', library: 'https://github.com/dlbeadle78/kellynwjec/tree/main/subjects/law' },
  history: { wjec: 'https://www.wjec.co.uk/qualifications/history-as-a-level/', library: 'https://github.com/dlbeadle78/kellynwjec/tree/main/subjects/history' },
  'welsh-bacc': { wjec: 'https://www.wjec.co.uk/qualifications/level-3-advanced-skills-baccalaureate-wales/', library: 'https://github.com/dlbeadle78/kellynwjec/tree/main/subjects/advanced-skills-baccalaureate' }
}

function statusClass(status) { return `learning-status learning-status-${status || 'not_started'}` }

export default function LearningSubjectsPage({ session, subjects = [], tasks = [], practice = [], go, notify }) {
  const availableSubjects = subjects.filter(subject => LEARNING_CONTENT[subject.slug])
  const [subjectSlug, setSubjectSlug] = useState(availableSubjects[0]?.slug || 'sociology')
  const [unitSlug, setUnitSlug] = useState(null)
  const [topicSlug, setTopicSlug] = useState(null)
  const [tab, setTab] = useState('learn')
  const [progress, setProgress] = useState([])
  const [revealed, setRevealed] = useState({})
  const [busyKey, setBusyKey] = useState('')

  const content = LEARNING_CONTENT[subjectSlug]
  const units = content?.units || []
  const unit = units.find(item => item.slug === unitSlug) || units[0]
  const topic = unit?.topics.find(item => item.slug === topicSlug) || unit?.topics[0]
  const depth = topic ? depthFor(subjectSlug, topic.slug) : null

  useEffect(() => {
    const firstSubject = availableSubjects.find(subject => subject.slug === subjectSlug) || availableSubjects[0]
    if (firstSubject && firstSubject.slug !== subjectSlug) setSubjectSlug(firstSubject.slug)
  }, [subjects])

  useEffect(() => {
    const nextContent = LEARNING_CONTENT[subjectSlug]
    const firstUnit = nextContent?.units?.[0]
    setUnitSlug(firstUnit?.slug || null)
    setTopicSlug(firstUnit?.topics?.[0]?.slug || null)
    setTab('learn'); setRevealed({})
  }, [subjectSlug])

  useEffect(() => {
    const nextUnit = units.find(item => item.slug === unitSlug) || units[0]
    if (!nextUnit) return
    if (!nextUnit.topics.some(item => item.slug === topicSlug)) setTopicSlug(nextUnit.topics[0]?.slug || null)
    setTab('learn'); setRevealed({})
  }, [unitSlug])

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('learning_progress').select('*').eq('user_id', session.user.id).then(({ data, error }) => {
      if (error) notify?.(error.message); else setProgress(data || [])
    })
  }, [session?.user?.id])

  const progressMap = useMemo(() => {
    const map = new Map(); progress.forEach(row => map.set(`${row.subject_slug}:${row.unit_slug}:${row.topic_slug}`, row)); return map
  }, [progress])

  function rowFor(s = subjectSlug, u = unit?.slug, t = topic?.slug) { return progressMap.get(`${s}:${u}:${t}`) }
  function topicStatus(targetTopic, targetUnit = unit) { return rowFor(subjectSlug, targetUnit?.slug, targetTopic?.slug)?.status || 'not_started' }

  const subjectTopics = units.flatMap(item => item.topics.map(topicItem => ({ ...topicItem, unitSlug: item.slug })))
  const startedCount = subjectTopics.filter(item => (rowFor(subjectSlug, item.unitSlug, item.slug)?.status || 'not_started') !== 'not_started').length
  const confidentCount = subjectTopics.filter(item => rowFor(subjectSlug, item.unitSlug, item.slug)?.status === 'confident').length
  const subjectProgress = subjectTopics.length ? Math.round(((startedCount * 0.45) + (confidentCount * 0.55)) / subjectTopics.length * 100) : 0

  async function setLearningStatus(status) {
    if (!topic || !unit || !session?.user?.id) return
    const key = `${subjectSlug}:${unit.slug}:${topic.slug}`; setBusyKey(key)
    const payload = { user_id: session.user.id, subject_slug: subjectSlug, unit_slug: unit.slug, topic_slug: topic.slug, status, last_opened_at: new Date().toISOString() }
    const { data, error } = await supabase.from('learning_progress').upsert(payload, { onConflict: 'user_id,subject_slug,unit_slug,topic_slug' }).select().single()
    setBusyKey('')
    if (error) return notify?.(error.message)
    setProgress(current => [...current.filter(row => row.id !== data.id && !(row.subject_slug === data.subject_slug && row.unit_slug === data.unit_slug && row.topic_slug === data.topic_slug)), data])
    notify?.(`Learning status: ${LEARNING_STATUS[status]}`)
  }

  function openTopic(nextTopic, targetUnit = unit) {
    setUnitSlug(targetUnit.slug); setTopicSlug(nextTopic.slug); setTab('learn'); setRevealed({})
    window.setTimeout(() => document.getElementById('learning-topic-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
  }

  function nextTopic() {
    if (!topic || !unit) return
    const flat = units.flatMap(unitItem => unitItem.topics.map(topicItem => ({ topic: topicItem, unit: unitItem })))
    const index = flat.findIndex(item => item.topic.slug === topic.slug && item.unit.slug === unit.slug)
    const next = flat[index + 1]; if (next) openTopic(next.topic, next.unit)
  }

  if (!content || !unit || !topic) return <div className="empty">Learning content is loading.</div>

  const subjectRecord = subjects.find(item => item.slug === subjectSlug)
  const relatedTasks = tasks.filter(item => item.subject_slug === subjectSlug && item.status !== 'completed')
  const subjectPractice = practice.filter(item => item.subject_slug === subjectSlug)
  const currentStatus = topicStatus(topic)
  const resourceLinks = RESOURCE_LINKS[subjectSlug]
  const currentIndex = unit.topics.findIndex(item => item.slug === topic.slug)
  const nextExists = currentIndex < unit.topics.length - 1 || units.findIndex(item => item.slug === unit.slug) < units.length - 1
  const readText = [topic.title, topic.summary, ...(depth?.depth || []), ...(depth?.evidence || []), ...(depth?.analysis || []), depth?.exam || ''].filter(Boolean).join('. ')

  return <div className="learning-shell">
    <div className="learning-subject-switcher" aria-label="Choose subject">
      {availableSubjects.map(item => <button key={item.slug} className={subjectSlug === item.slug ? 'active' : ''} onClick={() => setSubjectSlug(item.slug)}>{item.short_name}</button>)}
    </div>

    <section className="learning-heading">
      <div className={`learning-round-icon ${SUBJECT_META[subjectSlug]?.tone || ''}`}>{SUBJECT_META[subjectSlug]?.icon}</div>
      <div className="learning-heading-copy"><span className="learning-kicker">A-level / Level 3 learning</span><h2>{subjectRecord?.short_name || SUBJECT_META[subjectSlug]?.label}</h2><p>{content.intro}</p></div>
      <div className="learning-progress-card"><span>Your learning progress</span><strong>{subjectProgress}%</strong><div className="learning-progress-track"><span style={{ width: `${subjectProgress}%` }} /></div><small>{confidentCount} confident · {startedCount} started · {subjectTopics.length} topics</small></div>
    </section>

    <div className="learning-layout">
      <aside className="learning-curriculum" aria-label="Units and topics">
        <div className="learning-side-title"><BookOpen size={19}/><strong>Units & topics</strong></div>
        {units.map(unitItem => <section className="learning-unit" key={unitItem.slug}>
          <button className={`learning-unit-button ${unit.slug === unitItem.slug ? 'active' : ''}`} onClick={() => setUnitSlug(unitItem.slug)}><span>{unitItem.title}</span><ChevronRight size={17}/></button>
          {unit.slug === unitItem.slug && <div className="learning-topic-list">{unitItem.topics.map((topicItem, index) => {
            const status = topicStatus(topicItem, unitItem)
            return <button key={topicItem.slug} className={topic.slug === topicItem.slug ? 'active' : ''} onClick={() => openTopic(topicItem, unitItem)}><span className="learning-topic-number">{index + 1}</span><span><strong>{topicItem.title}</strong><small>{topicItem.time} mins</small></span><span className={statusClass(status)} title={LEARNING_STATUS[status]} /></button>
          })}</div>}
        </section>)}
        <div className="learning-reference-box"><strong>Official reference material</strong><p>Use WJEC to check the specification, papers and assessment requirements. Learning and practice stay inside the Hub.</p><a href={resourceLinks?.wjec} target="_blank" rel="noreferrer">WJEC qualification page <ExternalLink size={14}/></a><a href={resourceLinks?.library} target="_blank" rel="noreferrer">Kellyn WJEC resource library <ExternalLink size={14}/></a></div>
      </aside>

      <main className="learning-topic-panel" id="learning-topic-panel">
        <div className="learning-unit-context"><span>{unit.title}</span>{unit.note && <small>{unit.note}</small>}</div>
        <div className="learning-topic-head"><div><span className="learning-kicker">Current topic · about {topic.time} minutes</span><h2>{topic.title}</h2></div><div className="learning-read-actions"><SpeechControls text={readText} label="Read topic" /></div></div>

        {depth?.spec && <div className="learning-spec"><Scale size={18}/><div><strong>What the specification expects</strong><span>{depth.spec}</span></div></div>}

        <nav className="learning-tabs" aria-label="Learning stages">
          <button className={tab === 'learn' ? 'active' : ''} onClick={() => setTab('learn')}><BookOpen size={16}/> Learn</button>
          <button className={tab === 'depth' ? 'active' : ''} onClick={() => setTab('depth')}><Lightbulb size={16}/> A-level depth</button>
          <button className={tab === 'evidence' ? 'active' : ''} onClick={() => setTab('evidence')}><FileText size={16}/> Evidence & analysis</button>
          <button className={tab === 'terms' ? 'active' : ''} onClick={() => setTab('terms')}><FileText size={16}/> Key terms</button>
          <button className={tab === 'check' ? 'active' : ''} onClick={() => setTab('check')}><CheckCircle2 size={16}/> Check</button>
          <button className={tab === 'try' ? 'active' : ''} onClick={() => setTab('try')}><Target size={16}/> Try it</button>
        </nav>

        {tab === 'learn' && <div className="learning-stage">
          <section className="learning-simple-explanation"><div className="learning-section-title"><Lightbulb size={19}/><h3>Core understanding</h3></div><p>{topic.summary}</p></section>
          <section><div className="learning-section-title"><BookOpen size={19}/><h3>What you must understand</h3></div><div className="learning-key-ideas">{topic.keyIdeas.map((idea, index) => <div key={idea}><span>{index + 1}</span><p>{idea}</p></div>)}</div></section>
          <div className="learning-next-instruction"><Headphones size={20}/><div><strong>Do not stop at the summary</strong><span>Use A-level depth next. The first tab gives the structure; the next tabs contain the detail, named knowledge and evaluation needed for higher-level work.</span></div></div>
        </div>}

        {tab === 'depth' && <div className="learning-stage">
          <div className="learning-section-title"><Lightbulb size={19}/><h3>Detailed learning</h3></div>
          {depth?.depth?.length ? <div className="learning-depth-copy">{depth.depth.map((paragraph, index) => <section key={index}><span>{index + 1}</span><p>{paragraph}</p></section>)}</div> : <p className="learning-muted">Use your school notes and the WJEC specification for the detailed content of this topic. This section is still being expanded.</p>}
          {depth?.exam && <div className="learning-exam-box"><strong>Exam / assessment thinking</strong><p>{depth.exam}</p></div>}
        </div>}

        {tab === 'evidence' && <div className="learning-stage">
          <div className="learning-section-title"><FileText size={19}/><h3>Named knowledge, evidence and analysis</h3></div>
          <div className="learning-depth-grid">
            <section><strong>Knowledge and evidence to know</strong>{(depth?.evidence || ['Use the named evidence, cases, studies or events taught by school for this topic.']).map(item => <p key={item}>• {item}</p>)}</section>
            <section><strong>Questions that create analysis</strong>{(depth?.analysis || ['What supports this explanation?', 'What challenges it?', 'What judgement follows from the evidence?']).map(item => <p key={item}>• {item}</p>)}</section>
          </div>
          <div className="learning-boundary"><strong>Use evidence, do not memorise lists.</strong><span>Kellyn should be able to explain what the named study, authority, event or evidence proves and how it affects a judgement.</span></div>
        </div>}

        {tab === 'terms' && <div className="learning-stage"><div className="learning-section-title"><FileText size={19}/><h3>Key terms</h3></div><p className="learning-muted">Say the meaning yourself before re-reading the definition.</p><div className="learning-term-grid">{topic.terms.map(([term, definition]) => <article key={term}><strong>{term}</strong><p>{definition}</p><SpeechControls text={`${term}. ${definition}`} label="Listen" compact /></article>)}</div><button className="learning-primary" onClick={() => setTab('check')}>I’m ready to check myself <ChevronRight size={16}/></button></div>}

        {tab === 'check' && <div className="learning-stage"><div className="learning-section-title"><CheckCircle2 size={19}/><h3>Retrieval check</h3></div><p className="learning-muted">Try to answer before revealing the answer. Then explain one of the answers aloud in your own words.</p><div className="learning-recall-list">{topic.recall.map(([question, answer], index) => <article key={question}><strong>{index + 1}. {question}</strong>{revealed[index] ? <div className="learning-answer"><span>Check:</span>{answer}</div> : <button onClick={() => setRevealed(current => ({ ...current, [index]: true }))}>Show answer</button>}</article>)}</div><button className="learning-secondary" onClick={() => setRevealed({})}><RotateCcw size={16}/> Try the questions again</button></div>}

        {tab === 'try' && <div className="learning-stage"><div className="learning-section-title"><Target size={19}/><h3>Use what you have learned</h3></div><div className="learning-practice-box"><strong>Short learning activity</strong><p>{topic.activity}</p></div><div className="learning-boundary"><strong>Learning practice, not assessed schoolwork.</strong><span>The Hub can teach, quiz, structure and prompt. Kellyn completes any real assessed response herself.</span></div><button className="learning-secondary" onClick={() => go?.('practice')}>Go to Mock & Practice <ChevronRight size={16}/></button></div>}

        <section className="learning-confidence"><div><strong>How secure is this topic now?</strong><span>Be realistic. “Confident” means you can explain it and use the knowledge without simply rereading it.</span></div><div className="learning-confidence-buttons">
          {['needs_review','developing','confident'].map(status => <button disabled={busyKey === `${subjectSlug}:${unit.slug}:${topic.slug}`} className={currentStatus === status ? 'active' : ''} key={status} onClick={() => setLearningStatus(status)}>{LEARNING_STATUS[status]}</button>)}
        </div></section>

        <div className="learning-footer-row"><div><strong>{relatedTasks.length}</strong><span>open {subjectRecord?.short_name || 'subject'} task{relatedTasks.length === 1 ? '' : 's'}</span></div><div><strong>{subjectPractice.length}</strong><span>practice record{subjectPractice.length === 1 ? '' : 's'}</span></div>{nextExists && <button onClick={nextTopic}>Next topic <ChevronRight size={17}/></button>}</div>
      </main>
    </div>
  </div>
}
