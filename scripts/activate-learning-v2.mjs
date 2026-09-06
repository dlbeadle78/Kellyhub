import fs from 'node:fs'

function replaceOnce(text,from,to,label){
  if(text.includes(to))return text
  if(!text.includes(from))throw new Error(`Could not find ${label}`)
  return text.replace(from,to)
}

let app=fs.readFileSync('src/App.jsx','utf8')
app=replaceOnce(app,"import LearningSubjectsPage from './LearningSubjects.jsx'","import LearningSubjectsPage from './LearningSubjectsV2.jsx'",'learning page import')
app=replaceOnce(app,"<SpeechControls compact getText={()=>mainRef.current?.innerText || ''} label=\"Read aloud\" />","{route!=='subjects' && <SpeechControls compact getText={()=>mainRef.current?.innerText || ''} contentKey={`route:${route}`} label=\"Read aloud\" />}",'route-aware global read aloud')
fs.writeFileSync('src/App.jsx',app)

let learning=fs.readFileSync('src/LearningSubjectsV2.jsx','utf8')
learning=replaceOnce(learning,"onClick={()=>setStatus('developing')}","onClick={()=>setStatus('getting_there')}",'valid learning progress status')
fs.writeFileSync('src/LearningSubjectsV2.jsx',learning)
