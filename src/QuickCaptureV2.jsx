import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, Clipboard, Download, ExternalLink, File, Image, Link2, Plus, ScanLine, Sparkles, Upload } from 'lucide-react'
import { supabase } from './supabase.js'
import './quick-capture.css'
import './phase2-capture.css'

const EXTENSION_DOWNLOAD='https://github.com/dlbeadle78/Kellyhub/archive/refs/heads/main.zip'
const EXTENSION_GUIDE='https://github.com/dlbeadle78/Kellyhub/blob/main/chrome-extension/README.md'

function safeFileName(name='file'){return name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-')}
function fileKind(file){
  const n=file.name.toLowerCase(), t=(file.type||'').toLowerCase()
  if(t.startsWith('image/')) return 'image'
  if(n.endsWith('.pdf')) return 'assignment_brief'
  return 'other'
}
const MONTHS={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11,jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11}
const SUBJECT_TERMS={
  sociology:['sociology','crime and deviance','deviance','social inequality','stratification','research methods','merton','interactionism','functionalism'],
  law:['law','criminal law','contract','human rights','mens rea','actus reus','theft act','offences against','legal rule','case law'],
  history:['history','american century','civil rights','chartism','whig','reform and protest','rebecca riots','superpower','historical source','nea'],
  'welsh-bacc':['welsh bacc','baccalaureate','individual project','research project','future destination','global community','skills bacc']
}
function parseDue(text){
  const numeric=text.match(/(?:due|deadline|submit(?: by)?)?\s*(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/i)
  if(numeric){let y=numeric[3]?Number(numeric[3]):new Date().getFullYear();if(y<100)y+=2000;const d=new Date(y,Number(numeric[2])-1,Number(numeric[1]));if(!numeric[3]&&d<new Date(Date.now()-2592000000))d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10)}
  const words=text.match(/(?:due|deadline|submit(?: by)?)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?/i)
  if(words){let y=words[3]?Number(words[3]):new Date().getFullYear();const d=new Date(y,MONTHS[words[2].toLowerCase()],Number(words[1]));if(!words[3]&&d<new Date(Date.now()-2592000000))d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10)}
  return null
}
function classify(title,note,queued){
  const text=[title,note,...queued.map(f=>f.name)].join(' ').toLowerCase()
  const scores=Object.fromEntries(Object.keys(SUBJECT_TERMS).map(k=>[k,0]))
  for(const [slug,terms] of Object.entries(SUBJECT_TERMS)) for(const term of terms) if(text.includes(term)) scores[slug]+=term.includes(' ')?2:1
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);const subject=ranked[0][1]>0&&ranked[0][1]>ranked[1][1]?ranked[0][0]:null
  let type='resource'
  if(/feedback|teacher comment|marked|marking|improve|target/.test(text))type='teacher_feedback'
  else if(/homework|essay|assignment|coursework|task|submit|deadline|due/.test(text))type='school_task'
  else if(/revision|revise|practice|mock/.test(text))type='revision'
  else if(/notes|handout|slides|powerpoint|resource|reading/.test(text))type='resource'
  const due=parseDue(text)
  const confidence=Math.min(.95,.35+(ranked[0]?.[1]||0)*.15+(type!=='resource'?.15:0)+(due?.1:0))
  return {subject,type,due,confidence:Number(confidence.toFixed(2))}
}
async function enhanceImage(file){
  if(!(file.type||'').startsWith('image/')||file.type==='image/heic')return file
  try{
    const bitmap=await createImageBitmap(file);const max=2200;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.filter='grayscale(1) contrast(1.22) brightness(1.06)';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));if(!blob)return file;return new File([blob],file.name.replace(/\.[^.]+$/, '')+'-scan.jpg',{type:'image/jpeg'})
  }catch{return file}
}

export default function QuickCaptureV2({session,subjects=[],captures=[],files=[],loadAll,notify}){
  const [queued,setQueued]=useState([]),[title,setTitle]=useState(''),[subject,setSubject]=useState(''),[note,setNote]=useState('')
  const [busy,setBusy]=useState(false),[drag,setDrag]=useState(false),[enhance,setEnhance]=useState(true),[accepted,setAccepted]=useState(false)
  const [openingFileId,setOpeningFileId]=useState(null)
  const inputRef=useRef(null),cameraRef=useRef(null)
  const suggestion=useMemo(()=>classify(title,note,queued),[title,note,queued])

  useEffect(()=>{setAccepted(false)},[title,note,queued.length])
  useEffect(()=>{
    const hashQuery=location.hash.includes('?')?location.hash.split('?')[1]:''
    const params=new URLSearchParams(location.search||hashQuery)
    const incomingText=params.get('text'),incomingUrl=params.get('url'),incomingTitle=params.get('title')
    const incoming=[incomingText,incomingUrl?(incomingText?`Source: ${incomingUrl}`:incomingUrl):''].filter(Boolean).join('\n\n')
    if(incoming&&!note)setNote(incoming)
    if(incomingTitle&&!title)setTitle(incomingTitle)
  },[])
  useEffect(()=>{const onPaste=e=>{const pasted=Array.from(e.clipboardData?.files||[]);if(pasted.length){e.preventDefault();setQueued(current=>[...current,...pasted]);notify?.('Screenshot added to Quick Capture.')}};window.addEventListener('paste',onPaste);return()=>window.removeEventListener('paste',onPaste)},[])

  function addFiles(list){setQueued(current=>[...current,...Array.from(list||[])])}
  function removeFile(index){setQueued(current=>current.filter((_,i)=>i!==index))}
  function acceptSuggestion(){if(suggestion.subject)setSubject(suggestion.subject);setAccepted(true)}

  async function openAttachment(file){
    if(!file?.storage_path)return notify?.('This capture does not have a stored file to open.')
    setOpeningFileId(file.id)
    const preview=window.open('about:blank','_blank')
    if(preview){preview.opener=null;preview.document.title='Opening capture…'}
    const {data,error}=await supabase.storage.from('user-files').createSignedUrl(file.storage_path,600)
    setOpeningFileId(null)
    if(error||!data?.signedUrl){if(preview)preview.close();return notify?.(error?.message||'Could not open this capture.')}
    if(preview)preview.location.replace(data.signedUrl)
    else window.open(data.signedUrl,'_blank','noopener,noreferrer')
  }

  async function save(e){
    e.preventDefault();if(!queued.length&&!note.trim())return notify?.('Add a note, link, screenshot or file first.');setBusy(true)
    const isUrl=!queued.length&&/^https?:\/\//i.test(note.trim());const captureType=queued.length?(queued.every(f=>(f.type||'').startsWith('image/'))?'image':'file'):(isUrl?'link':'text')
    const finalSubject=subject||null
    const {data:capture,error:captureError}=await supabase.from('quick_capture').insert({user_id:session.user.id,capture_type:captureType,title:title.trim()||null,content:isUrl?null:(note.trim()||null),source_url:isUrl?note.trim():null,subject_slug:finalSubject,processed:accepted,suggested_subject_slug:suggestion.subject,suggested_type:suggestion.type,suggested_due_date:suggestion.due,classification_confidence:suggestion.confidence}).select().single()
    if(captureError){setBusy(false);return notify?.(captureError.message)}
    for(let i=0;i<queued.length;i++){
      const original=queued[i],file=enhance?await enhanceImage(original):original
      const path=`${session.user.id}/captures/${capture.id}/${String(i+1).padStart(2,'0')}-${Date.now()}-${safeFileName(file.name)}`
      const {error:storageError}=await supabase.storage.from('user-files').upload(path,file,{upsert:false});if(storageError){notify?.(storageError.message);continue}
      const {error:fileError}=await supabase.from('user_files').insert({user_id:session.user.id,capture_id:capture.id,subject_slug:finalSubject,storage_path:path,original_name:original.name,mime_type:file.type,size_bytes:file.size,file_type:suggestion.type==='teacher_feedback'?'teacher_feedback':fileKind(original)});if(fileError)notify?.(fileError.message)
    }
    setBusy(false);setQueued([]);setTitle('');setSubject('');setNote('');setAccepted(false);await loadAll();notify?.(accepted?'Captured and classified.':'Captured. The original is safely stored.')
  }

  const recent=captures.slice(0,8),suggestedSubject=subjects.find(s=>s.slug===suggestion.subject)?.short_name
  return <div className="qc-shell">
    <section className="qc-intro"><div><span>Capture → recognise → confirm</span><h2>Add anything to Kellyn Hub</h2><p>Photograph a paper handout, paste a screenshot, drag in a file or paste teacher instructions. The Hub now suggests what it is, then asks for confirmation.</p></div><div className="qc-shortcut"><Clipboard/><strong>Windows screenshot</strong><span>Win + Shift + S, then Ctrl + V here.</span></div></section>
    <div className="qc-grid">
      <form className="qc-capture" onSubmit={save} onDragEnter={e=>{e.preventDefault();setDrag(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}>
        <div className="qc-actions"><button type="button" onClick={()=>inputRef.current?.click()}><Upload/><span>Upload files</span></button><button type="button" onClick={()=>cameraRef.current?.click()}><Camera/><span>Scan paper</span></button><button type="button" onClick={()=>navigator.clipboard?.readText().then(text=>text&&setNote(text)).catch(()=>notify?.('Use Ctrl + V or Paste in the text box.'))}><Clipboard/><span>Paste text</span></button></div>
        <input ref={inputRef} className="qc-hidden" type="file" multiple accept="image/*,.heic,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={e=>addFiles(e.target.files)}/><input ref={cameraRef} className="qc-hidden" type="file" accept="image/*" capture="environment" onChange={e=>addFiles(e.target.files)}/>
        <div className={`qc-drop ${drag?'active':''}`} onClick={()=>inputRef.current?.click()}><Upload size={28}/><strong>Drag and drop files here</strong><span>or tap to choose files</span><small>Multiple photographed pages stay together as one capture.</small></div>
        {queued.length>0&&<><label className="qc-enhance"><input type="checkbox" checked={enhance} onChange={e=>setEnhance(e.target.checked)}/><ScanLine/><span><strong>Improve photographed pages</strong><small>Creates a higher-contrast reading copy while keeping the capture private.</small></span></label><div className="qc-queued"><div className="qc-queued-head"><strong>{queued.length} file{queued.length===1?'':'s'} ready</strong><span>{queued.length>1?'Saved together as one document capture.':''}</span></div>{queued.map((file,index)=><div className="qc-file" key={`${file.name}-${index}`}>{(file.type||'').startsWith('image/')?<Image/>:<File/>}<span><strong>{file.name}</strong><small>{Math.max(1,Math.round(file.size/1024))} KB</small></span><button type="button" onClick={()=>removeFile(index)}>Remove</button></div>)}</div></>}
        <label>Quick note, teacher instruction or web link<textarea rows="4" value={note} onChange={e=>setNote(e.target.value)} placeholder="Paste the task wording if you have it. This helps the Hub recognise subject, type and deadline."/></label>
        <div className="qc-fields"><label>Short title <span>optional</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. History source task"/></label><label>Subject <span>optional</span><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Let Hub suggest</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select></label></div>
        {(suggestion.subject||suggestion.due||suggestion.type!=='resource')&&<div className={`qc-suggestion ${accepted?'accepted':''}`}><Sparkles/><div><strong>This looks like:</strong><span>{suggestedSubject||'Subject uncertain'} · {suggestion.type.replaceAll('_',' ')}{suggestion.due?` · due ${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long'}).format(new Date(`${suggestion.due}T12:00:00`))}`:''}</span><small>Confidence {Math.round(suggestion.confidence*100)}%. Check it before saving.</small></div><button type="button" onClick={acceptSuggestion}>{accepted?<><CheckCircle2/> Confirmed</>:<>Use suggestion</>}</button></div>}
        <button className="qc-save" disabled={busy}><Plus/>{busy?'Saving…':'Save capture'}</button><p className="qc-boundary">Classification uses the text, title and file names available in the capture. Image-only documents are not silently guessed. Kellyn can confirm or change the result.</p>
      </form>
      <aside className="qc-side">
        <section className="qc-extension">
          <div className="qc-extension-head"><span className="qc-extension-icon"><Download/></span><div><span>Chrome extension</span><h2>Capture from Teams & websites</h2></div></div>
          <p>Capture a visible screenshot, selected Teams text, teacher instructions, a web page or a useful link and send it straight into Quick Capture. Kellyn reviews everything before it is saved.</p>
          <div className="qc-extension-actions"><a href={EXTENSION_DOWNLOAD}><Download size={16}/> Download extension</a><a href={EXTENSION_GUIDE} target="_blank" rel="noreferrer">Install guide <ExternalLink size={15}/></a></div>
          <ol><li>Download and unzip <strong>Kellyhub-main</strong>.</li><li>Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.</li><li>Choose <strong>Load unpacked</strong> and select the <code>chrome-extension</code> folder.</li><li>Pin <strong>Add to Kellyn Hub</strong> in Chrome.</li></ol>
          <small>Works with Teams in the browser, WJEC pages and other school websites. The extension only captures when Kellyn chooses an action.</small>
        </section>
        <section className="qc-recent">
          <div className="qc-recent-head"><div><h2>Recent captures</h2><p>Open saved screenshots and files directly from here.</p></div></div>
          <div className="qc-recent-list">{recent.map(c=>{const attached=files.filter(f=>f.capture_id===c.id);return <article key={c.id}><span className="qc-kind">{c.capture_type==='link'?<Link2/>:c.capture_type==='image'?<Image/>:<File/>}</span><div className="qc-recent-body"><strong className="qc-recent-title">{c.title||c.source_url||attached[0]?.original_name||'Quick capture'}</strong><small>{c.subject_slug||c.suggested_subject_slug||'Unsorted'} · {new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(c.created_at))}</small>{c.content&&<p className="qc-recent-content">{c.content}</p>}{attached.length>0&&<div className="qc-attachment-actions">{attached.map((file,index)=>{const isImage=(file.mime_type||'').startsWith('image/');return <button type="button" key={file.id||file.storage_path} onClick={()=>openAttachment(file)} disabled={openingFileId===file.id}><ExternalLink size={14}/><span>{openingFileId===file.id?'Opening…':isImage?'View screenshot':attached.length>1?`Open file ${index+1}`:'Open file'}</span></button>})}</div>}</div></article>})}{!recent.length&&<div className="qc-empty">Nothing captured yet.</div>}</div>
        </section>
      </aside>
    </div>
  </div>
}
