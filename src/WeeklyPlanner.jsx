import React, { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Trash2 } from 'lucide-react'
import { supabase } from './supabase.js'
import './WeeklyPlanner.css'

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const START_HOUR = 0
const END_HOUR = 24
const DAY_MINUTES = (END_HOUR - START_HOUR) * 60

const CATEGORY_LABELS = {
  school: 'School',
  work: 'My Work',
  revision: 'Revision',
  activity: 'Activity',
  ucas: 'UCAS',
  university: 'University',
  personal: 'Personal',
  travel: 'Travel',
}

function mondayOf(value) {
  const d = new Date(value)
  d.setHours(0,0,0,0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function addDays(value, days) {
  const d = new Date(value)
  d.setDate(d.getDate() + days)
  return d
}

function isoDay(value) {
  const d = new Date(value)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

function fmtShort(value) {
  return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short' }).format(value)
}

function fmtWeek(start) {
  const end = addDays(start,6)
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()
  if (sameMonth && sameYear) return `${start.getDate()}–${end.getDate()} ${new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(start)}`
  return `${fmtShort(start)} – ${fmtShort(end)} ${end.getFullYear()}`
}

function timeMinutes(value) {
  if (!value) return null
  if (value.includes('T')) {
    const d = new Date(value)
    return d.getHours()*60+d.getMinutes()
  }
  const [h,m] = value.slice(0,5).split(':').map(Number)
  return h*60+m
}

function fmtTime(value) {
  if (!value) return ''
  if (value.includes('T')) return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date(value))
  return value.slice(0,5)
}

function timetableWeekForDate(value) {
  const anchor = new Date(2026,7,31)
  anchor.setHours(0,0,0,0)
  const current = new Date(value)
  current.setHours(0,0,0,0)
  const weekIndex = Math.floor((current-anchor)/604800000)
  return (((weekIndex%2)+2)%2)+1
}

function clampBlock(startMinutes,endMinutes) {
  const dayStart = START_HOUR*60
  const start = Math.max(dayStart,startMinutes ?? dayStart)
  const end = Math.min(END_HOUR*60,endMinutes ?? (start+60))
  if (end <= dayStart || start >= END_HOUR*60) return null
  return {
    top: Math.max(0,start-dayStart),
    height: Math.max(24,end-start-2),
  }
}

function CalendarBlock({ item, kind, onDelete }) {
  const start = timeMinutes(item.starts_at || item.start_time || item.depart_time)
  const end = timeMinutes(item.ends_at || item.end_time || item.arrive_time) ?? ((start ?? 0)+30)
  const pos = clampBlock(start,end)
  if (!pos) return null
  const subject = item.subject_slug || ''
  const category = kind === 'timetable' ? (subject || item.entry_type || 'school') : kind === 'travel' ? 'travel' : (item.category || 'personal')
  const title = item.title || item.label || `${item.origin || ''}${item.destination ? ` → ${item.destination}` : ''}`
  const location = item.location || item.room || item.service || ''
  return <article
    className={`week-event week-event-${kind} week-event-${category}`}
    style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
    title={`${title} ${fmtTime(item.starts_at || item.start_time || item.depart_time)}`}
  >
    <div className="week-event-head">
      <strong>{title}</strong>
      {kind === 'event' && <button className="week-delete" type="button" onClick={(e)=>{e.stopPropagation();onDelete?.(item)}} aria-label={`Delete ${title}`} title="Delete event"><Trash2 size={14}/></button>}
    </div>
    <span className="week-event-time">{fmtTime(item.starts_at || item.start_time || item.depart_time)}{end ? `–${fmtTime(item.ends_at || item.end_time || item.arrive_time) || `${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`}` : ''}</span>
    {location && <small><MapPin size={11}/>{location}</small>}
  </article>
}

export default function WeeklyPlanner({ session, subjects=[], events=[], timetable=[], travel=[], tasks=[], loadAll, notify }) {
  const [weekStart,setWeekStart] = useState(()=>mondayOf(new Date()))
  const [showAdd,setShowAdd] = useState(false)
  const [busy,setBusy] = useState(false)
  const days = useMemo(()=>Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart])
  const viewedSchoolWeek = timetableWeekForDate(weekStart)
  const now = new Date()

  const visibleEvents = useMemo(()=>{
    const start = new Date(weekStart)
    const end = addDays(start,7)
    return events.filter(e=>{const d=new Date(e.starts_at); return d>=start && d<end})
  },[events,weekStart])

  const deadlinesByDay = useMemo(()=>{
    const map = new Map()
    tasks.filter(t=>t.due_at && t.status!=='completed').forEach(t=>{
      const key=isoDay(new Date(t.due_at))
      if(!map.has(key)) map.set(key,[])
      map.get(key).push(t)
    })
    return map
  },[tasks])

  async function addEvent(e) {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const startRaw = fd.get('start')
    const endRaw = fd.get('end')
    const start = new Date(startRaw)
    const end = endRaw ? new Date(endRaw) : null
    if (end && end <= start) {
      setBusy(false)
      return notify?.('End time must be after the start time.')
    }
    const { error } = await supabase.from('planner_events').insert({
      user_id: session.user.id,
      title: fd.get('title'),
      category: fd.get('category'),
      subject_slug: fd.get('subject') || null,
      starts_at: start.toISOString(),
      ends_at: end ? end.toISOString() : null,
      location: fd.get('location') || null,
      notes: fd.get('notes') || null,
    })
    setBusy(false)
    if(error) return notify?.(error.message)
    e.currentTarget.reset()
    setShowAdd(false)
    await loadAll?.()
    notify?.('Event added to the calendar.')
  }

  async function deleteEvent(item) {
    const ok = window.confirm(`Delete “${item.title}”?`)
    if(!ok) return
    const { error } = await supabase.from('planner_events').delete().eq('id',item.id).eq('user_id',session.user.id)
    if(error) return notify?.(error.message)
    await loadAll?.()
    notify?.('Event deleted.')
  }

  function previousWeek(){ setWeekStart(d=>addDays(d,-7)) }
  function nextWeek(){ setWeekStart(d=>addDays(d,7)) }
  function thisWeek(){ setWeekStart(mondayOf(new Date())) }

  const hourLabels = Array.from({length:END_HOUR-START_HOUR+1},(_,i)=>START_HOUR+i)

  return <div className="weekly-planner stack-lg">
    <div className="calendar-toolbar">
      <div className="calendar-nav-group">
        <button type="button" className="calendar-icon-btn" onClick={previousWeek} aria-label="Previous week"><ChevronLeft/></button>
        <button type="button" className="calendar-today-btn" onClick={thisWeek}>This week</button>
        <button type="button" className="calendar-icon-btn" onClick={nextWeek} aria-label="Next week"><ChevronRight/></button>
      </div>
      <div className="calendar-title-wrap">
        <h2>{fmtWeek(weekStart)}</h2>
        <p>7-day calendar · School timetable Week {viewedSchoolWeek}</p>
      </div>
      <button type="button" className="calendar-add-btn" onClick={()=>setShowAdd(v=>!v)}><Plus size={18}/>{showAdd?'Close':'Add event'}</button>
    </div>

    {showAdd && <section className="calendar-add-panel">
      <div className="calendar-add-heading"><CalendarDays/><div><h3>Add to Kellyn’s calendar</h3><p>School, revision, UCAS, activities, appointments and personal plans all appear in the same week.</p></div></div>
      <form className="calendar-event-form" onSubmit={addEvent}>
        <label>Event<input name="title" placeholder="e.g. Choir rehearsal" required/></label>
        <label>Starts<input type="datetime-local" name="start" required/></label>
        <label>Ends<input type="datetime-local" name="end"/></label>
        <label>Category<select name="category" defaultValue="activity">
          <option value="school">School</option><option value="work">My Work</option><option value="revision">Revision</option><option value="activity">Activity</option><option value="ucas">UCAS</option><option value="university">University</option><option value="personal">Personal</option>
        </select></label>
        <label>Subject<select name="subject"><option value="">No subject</option>{subjects.map(s=><option key={s.slug} value={s.slug}>{s.short_name}</option>)}</select></label>
        <label>Location<input name="location" placeholder="Optional"/></label>
        <label className="calendar-notes-field">Notes<textarea name="notes" placeholder="Optional short note" rows="2"/></label>
        <button className="calendar-save-btn" disabled={busy}>{busy?'Adding…':'Add to calendar'}</button>
      </form>
    </section>}

    <div className="calendar-legend" aria-label="Calendar legend">
      {Object.entries(CATEGORY_LABELS).map(([key,label])=><span key={key}><i className={`legend-dot legend-${key}`}/>{label}</span>)}
    </div>

    <div className="weekly-calendar-scroll">
      <div className="weekly-calendar-grid">
        <div className="week-corner"><Clock3 size={16}/></div>
        {days.map((day,i)=>{
          const today = isoDay(day)===isoDay(now)
          const deadlines = deadlinesByDay.get(isoDay(day)) || []
          return <div className={`week-day-head ${today?'is-today':''}`} key={isoDay(day)}>
            <strong>{DAY_NAMES[i]}</strong><span>{day.getDate()} {new Intl.DateTimeFormat('en-GB',{month:'short'}).format(day)}</span>
            {deadlines.length>0 && <small>{deadlines.length} deadline{deadlines.length===1?'':'s'}</small>}
          </div>
        })}

        <div className="week-all-day-label">Deadlines</div>
        {days.map(day=>{
          const deadlines = deadlinesByDay.get(isoDay(day)) || []
          return <div className="week-all-day-cell" key={`all-${isoDay(day)}`}>
            {deadlines.slice(0,3).map(t=><span className="deadline-pill" key={t.id}>{t.title}</span>)}
            {deadlines.length>3 && <span className="deadline-more">+{deadlines.length-3} more</span>}
          </div>
        })}

        <div className="week-time-column" style={{height:`${DAY_MINUTES}px`}}>
          {hourLabels.map(hour=><span key={hour} style={{top:`${(hour-START_HOUR)*60}px`}}>{String(hour).padStart(2,'0')}:00</span>)}
        </div>

        {days.map((day,i)=>{
          const schoolWeek = timetableWeekForDate(day)
          const dayOfWeek = i+1
          const dayEvents = visibleEvents.filter(e=>isoDay(new Date(e.starts_at))===isoDay(day))
          const dayTimetable = dayOfWeek<=5 ? timetable.filter(x=>x.day_of_week===dayOfWeek && (x.week_number||1)===schoolWeek) : []
          const dayTravel = dayOfWeek<=5 ? travel : []
          const today = isoDay(day)===isoDay(now)
          const nowMinutes = now.getHours()*60+now.getMinutes()
          const showNow = today && nowMinutes>=START_HOUR*60 && nowMinutes<=END_HOUR*60
          return <div className={`week-day-lane ${today?'is-today':''}`} style={{height:`${DAY_MINUTES}px`}} key={`lane-${isoDay(day)}`}>
            {hourLabels.map(hour=><i className="hour-rule" key={hour} style={{top:`${(hour-START_HOUR)*60}px`}}/>)}
            {showNow && <i className="now-line" style={{top:`${nowMinutes-START_HOUR*60}px`}}><span/></i>}
            {dayTimetable.map(x=><CalendarBlock item={x} kind="timetable" key={`t-${x.id}`}/>) }
            {dayTravel.map(x=><CalendarBlock item={x} kind="travel" key={`r-${x.id}-${isoDay(day)}`}/>) }
            {dayEvents.map(x=><CalendarBlock item={x} kind="event" onDelete={deleteEvent} key={`e-${x.id}`}/>) }
          </div>
        })}
      </div>
    </div>

    <section className="calendar-week-summary">
      <div><strong>{visibleEvents.length}</strong><span>added event{visibleEvents.length===1?'':'s'} this week</span></div>
      <div><strong>{events.length}</strong><span>total saved calendar events</span></div>
      <div><strong>{viewedSchoolWeek}</strong><span>school timetable week</span></div>
    </section>
  </div>
}
