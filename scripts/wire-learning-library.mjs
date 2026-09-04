import fs from 'node:fs'

function replaceOnce(text,from,to,label){
  if(text.includes(to))return text
  if(!text.includes(from))throw new Error(`Could not find ${label}`)
  return text.replace(from,to)
}

let app=fs.readFileSync('src/App.jsx','utf8')
app=replaceOnce(app,'  Upload, UserRound, Volume2, X, FileText, University, Brain, ShieldCheck\n','  Upload, UserRound, Volume2, X, FileText, University, Brain, ShieldCheck, FolderOpen\n','App icon import')
app=replaceOnce(app,"import Phase2Resources from './Phase2Resources.jsx'\n","import Phase2Resources from './Phase2Resources.jsx'\nimport Phase4Library from './Phase4Library.jsx'\n",'Library import')
app=replaceOnce(app,"  ['resources', 'Resources & AI', NotebookTabs],\n","  ['library', 'My Library', FolderOpen],\n  ['resources', 'Resources & AI', NotebookTabs],\n",'Library nav')
app=replaceOnce(app,"        {route==='resources' && <Phase2Resources {...common()} />}\n","        {route==='library' && <Phase4Library {...common()} />}\n        {route==='resources' && <Phase2Resources {...common()} />}\n",'Library route')
fs.writeFileSync('src/App.jsx',app)

let qc=fs.readFileSync('src/QuickCaptureV2.jsx','utf8')
qc=replaceOnce(qc,"import { supabase } from './supabase.js'\n","import { supabase } from './supabase.js'\nimport CapturePurposeRouter from './CapturePurposeRouter.jsx'\n",'Capture router import')
qc=replaceOnce(qc,"export default function QuickCaptureV2({session,subjects=[],captures=[],files=[],loadAll,notify}){","export default function QuickCaptureV2({session,subjects=[],captures=[],files=[],loadAll,notify,go}){",'Quick Capture props')
qc=qc.replace('<h2>Recent captures</h2><p>Open saved screenshots and files directly from here.</p>','<h2>Capture inbox</h2><p>Open the original, then choose how Kellyn Hub should use it.</p>')
if(!qc.includes('<CapturePurposeRouter capture={c}')){
  const recentStart=qc.indexOf('<div className="qc-recent-list">')
  if(recentStart<0)throw new Error('Recent capture list not found')
  const tail='</div>}</div></article>'
  const tailIndex=qc.indexOf(tail,recentStart)
  if(tailIndex<0)throw new Error('Recent capture card tail not found')
  const insert='</div>}<CapturePurposeRouter capture={c} files={files} session={session} notify={notify} loadAll={loadAll} go={go}/></div></article>'
  qc=qc.slice(0,tailIndex)+insert+qc.slice(tailIndex+tail.length)
}
fs.writeFileSync('src/QuickCaptureV2.jsx',qc)
