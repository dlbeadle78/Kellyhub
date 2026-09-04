import fs from 'node:fs'

function replaceOnce(text,from,to,label){
  if(text.includes(to))return text
  if(!text.includes(from))throw new Error(`Could not find ${label}`)
  return text.replace(from,to)
}

// App: keep the signed-in profile/settings personal, but load all Kellyn data through workspace_owner_id.
let app=fs.readFileSync('src/App.jsx','utf8')
const loadStart=app.indexOf('  async function loadAll() {')
const loadEnd=app.indexOf('\n\n  function notify(',loadStart)
if(loadStart<0||loadEnd<0)throw new Error('Could not locate App loadAll')
const newLoad=`  async function loadAll() {
    if (!session?.user) return
    setRefreshing(true)
    const authUid = session.user.id
    const profileRequest = await supabase.from('profiles').select('*').eq('id', authUid).maybeSingle()
    if (profileRequest.error) notify(profileRequest.error.message)
    const nextProfile = profileRequest.data
    const uid = nextProfile?.workspace_owner_id || authUid
    const requests = await Promise.all([
      supabase.from('subjects').select('*').order('sort_order'),
      supabase.from('tasks').select('*').eq('user_id', uid).order('due_at', { ascending: true, nullsFirst: false }),
      supabase.from('task_steps').select('*').eq('user_id', uid).order('order_index'),
      supabase.from('planner_events').select('*').eq('user_id', uid).order('starts_at'),
      supabase.from('timetable_entries').select('*').eq('user_id', uid).order('day_of_week').order('start_time'),
      supabase.from('travel_entries').select('*').eq('user_id', uid).eq('active', true).order('direction').order('sequence'),
      supabase.from('evidence_bank').select('*').eq('user_id', uid).order('event_date', { ascending: false, nullsFirst: false }),
      supabase.from('university_choices').select('*').eq('user_id', uid).order('favourite', { ascending: false }).order('university_name'),
      supabase.from('practice_records').select('*').eq('user_id', uid).order('completed_at', { ascending: false }),
      supabase.from('independent_skills').select('*').eq('user_id', uid).order('category').order('skill'),
      supabase.from('quick_capture').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('user_files').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
    const errors = requests.filter(r=>r.error).map(r=>r.error.message)
    if (errors.length) notify(errors[0])
    setProfile(nextProfile)
    setSubjects(requests[0].data || [])
    setTasks(requests[1].data || [])
    setSteps(requests[2].data || [])
    setEvents(requests[3].data || [])
    setTimetable(requests[4].data || [])
    setTravel(requests[5].data || [])
    setEvidence(requests[6].data || [])
    setUniversities(requests[7].data || [])
    setPractice(requests[8].data || [])
    setSkills(requests[9].data || [])
    setCaptures(requests[10].data || [])
    setFiles(requests[11].data || [])
    setRefreshing(false)
  }`
app=app.slice(0,loadStart)+newLoad+app.slice(loadEnd)

app=replaceOnce(app,
"  if (!session) return <AuthScreen />\n\n  const pageTitle",
"  if (!session) return <AuthScreen />\n\n  const dataOwnerId = profile?.workspace_owner_id || session.user.id\n  const workspaceSession = dataOwnerId === session.user.id ? session : { ...session, user: { ...session.user, id: dataOwnerId } }\n\n  const pageTitle",
'workspace session')

app=replaceOnce(app,
"        {route==='settings' && <Phase2Settings {...common()} />}",
"        {route==='settings' && <Phase2Settings {...common()} session={session} workspaceOwnerId={dataOwnerId} />}",
'personal settings session')

app=replaceOnce(app,
"    return { session, profile, subjects, tasks, steps, events, timetable, travel, evidence, universities, practice, skills, captures, files, loadAll, notify, go, updateProfile, refreshing }",
"    return { session: workspaceSession, authSession: session, workspaceOwnerId: dataOwnerId, profile, subjects, tasks, steps, events, timetable, travel, evidence, universities, practice, skills, captures, files, loadAll, notify, go, updateProfile, refreshing }",
'common workspace session')
fs.writeFileSync('src/App.jsx',app)

// Settings: notifications remain per login; independent-living skills belong to the shared Kellyn workspace.
let settings=fs.readFileSync('src/Phase2Settings.jsx','utf8')
settings=replaceOnce(settings,
"export default function Phase2Settings({profile,updateProfile,session,skills=[],loadAll,notify}){",
"export default function Phase2Settings({profile,updateProfile,session,workspaceOwnerId,skills=[],loadAll,notify}){",
'settings workspace prop')
settings=replaceOnce(settings,
"async function addSkill(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('independent_skills').upsert({user_id:session.user.id,category:fd.get('category'),skill:fd.get('skill'),status:'to_learn'},{onConflict:'user_id,category,skill'});",
"async function addSkill(e){e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabase.from('independent_skills').upsert({user_id:workspaceOwnerId||session.user.id,category:fd.get('category'),skill:fd.get('skill'),status:'to_learn'},{onConflict:'user_id,category,skill'});",
'shared independent skills owner')
fs.writeFileSync('src/Phase2Settings.jsx',settings)

// Support view: read/write the student's shared workspace rather than an empty per-login dataset.
let support=fs.readFileSync('src/Phase3Support.jsx','utf8')
support=replaceOnce(support,
".select('id,display_name,role,created_at')",
".select('id,display_name,role,workspace_owner_id,created_at')",
'support profile workspace owner')
support=replaceOnce(support,
"  useEffect(()=>{if(studentId)loadStudent(studentId)},[studentId])\n",
"  useEffect(()=>{if(studentId)loadStudent(studentId)},[studentId,students])\n  function ownerFor(id){return students.find(s=>s.id===id)?.workspace_owner_id||id}\n",
'support owner helper')

const loadStudentStart=support.indexOf('  async function loadStudent(id){')
const addTaskStart=support.indexOf('\n  async function addTask(e){',loadStudentStart)
if(loadStudentStart<0||addTaskStart<0)throw new Error('Could not locate support loadStudent')
const newLoadStudent=`  async function loadStudent(id){
    const dataId=ownerFor(id)
    setLoading(true)
    const qs=await Promise.all([
      supabase.from('tasks').select('*').eq('user_id',dataId).order('due_at',{ascending:true,nullsFirst:false}),
      supabase.from('learning_progress').select('*').eq('user_id',dataId),
      supabase.from('practice_records').select('*').eq('user_id',dataId).order('completed_at',{ascending:false}),
      supabase.from('university_choices').select('*').eq('user_id',dataId),
      supabase.from('independent_skills').select('*').eq('user_id',dataId),
      supabase.from('timetable_entries').select('*').eq('user_id',dataId).order('day_of_week').order('start_time'),
      supabase.from('travel_entries').select('*').eq('user_id',dataId).eq('active',true),
      supabase.from('support_preferences').select('*').eq('user_id',id).maybeSingle()
    ])
    const err=qs.find(q=>q.error)?.error
    if(err)notify?.(err.message)
    setData({tasks:qs[0].data||[],learning:qs[1].data||[],practice:qs[2].data||[],universities:qs[3].data||[],skills:qs[4].data||[],timetable:qs[5].data||[],travel:qs[6].data||[],prefs:qs[7].data||null})
    setLoading(false)
  }`
support=support.slice(0,loadStudentStart)+newLoadStudent+support.slice(addTaskStart)

const taskStart=support.indexOf('  async function addTask(e){')
const eventStart=support.indexOf('\n  async function addEvent(e){',taskStart)
if(taskStart<0||eventStart<0)throw new Error('Could not locate support addTask')
const newAddTask=`  async function addTask(e){
    e.preventDefault()
    const fd=new FormData(e.currentTarget)
    const dataId=ownerFor(studentId)
    const {data:t,error}=await supabase.from('tasks').insert({user_id:dataId,title:fd.get('title'),subject_slug:fd.get('subject')||null,due_at:fd.get('due')?new Date(\`${'${fd.get(\'due\')}'}T16:00:00\`).toISOString():null,status:'not_started',next_action:'Read the task and identify what it is asking.',assessed:fd.get('assessed')==='on'}).select().single()
    if(error)return notify?.(error.message)
    await supabase.from('task_steps').insert([
      {task_id:t.id,user_id:dataId,title:'Read the task and identify the command word.',order_index:0,estimated_minutes:10},
      {task_id:t.id,user_id:dataId,title:'Gather the notes, sources or teacher guidance needed.',order_index:1,estimated_minutes:10},
      {task_id:t.id,user_id:dataId,title:'Make a simple plan in your own words.',order_index:2,estimated_minutes:15}
    ])
    e.currentTarget.reset();await loadStudent(studentId);notify?.('Task added to the shared Kellyn work queue.')
  }`
support=support.slice(0,taskStart)+newAddTask+support.slice(eventStart)

const addEventStart=support.indexOf('  async function addEvent(e){')
const savePrefsStart=support.indexOf('\n  async function savePrefs(',addEventStart)
if(addEventStart<0||savePrefsStart<0)throw new Error('Could not locate support addEvent')
const newAddEvent=`  async function addEvent(e){
    e.preventDefault()
    const fd=new FormData(e.currentTarget),start=new Date(fd.get('start')),dataId=ownerFor(studentId)
    const {error}=await supabase.from('planner_events').insert({user_id:dataId,title:fd.get('title'),category:fd.get('category'),starts_at:start.toISOString(),ends_at:new Date(start.getTime()+Number(fd.get('minutes')||60)*60000).toISOString(),notes:fd.get('notes')||null})
    if(error)return notify?.(error.message)
    e.currentTarget.reset();await loadStudent(studentId);notify?.('Planner event added to the shared workspace.')
  }`
support=support.slice(0,addEventStart)+newAddEvent+support.slice(savePrefsStart)

const copyStart=support.indexOf('  async function copySchedule(){')
const copyEnd=support.indexOf('\n\n  if(profile?.role',copyStart)
if(copyStart>=0&&copyEnd>=0)support=support.slice(0,copyStart)+"  async function copySchedule(){notify?.('Kellyn already uses the shared timetable and travel workspace.')}"+support.slice(copyEnd)
support=support.replace("{(!data.timetable.length||!data.travel.length)&&<button onClick={copySchedule}>Copy confirmed timetable & travel</button>}","<small>Shared Kellyn workspace</small>")
fs.writeFileSync('src/Phase3Support.jsx',support)
