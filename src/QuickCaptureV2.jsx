import React, { useEffect, useRef, useState } from 'react'
import { Camera, Clipboard, File, Image, Link2, Plus, Upload } from 'lucide-react'
import { supabase } from './supabase.js'
import './quick-capture.css'

function safeFileName(name='file'){return name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-')}
function fileKind(file){
  const n=file.name.toLowerCase(), t=file.type.toLowerCase()
  if(t.startsWith('image/')) return 'image'
  if(n.endsWith('.pdf')) return 'assignment_brief'
  if(n.endsWith('.doc')||n.endsWith('.docx')) return 'other'
  if(n.endsWith('.ppt')||n.endsWith('.pptx')) return 'other'
  if(n.endsWith('.xls')||n.endsWith('.xlsx')) return 'other'
  return 'other'
}

export default function QuickCaptureV2({session,subjects=[],captures=[],files=[],loadAll,notify}){
  const [queued,setQueued]=useState([])
  const [title,setTitle]=useState('')
  const [subject,setSubject]=useState('')
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [drag,setDrag]=useState(false)
  const inputRef=useRef(null)
  const cameraRef=useRef(null)

  useEffect(()=>{
    const onPaste=e=>{
      const pasted=Array.from(e.clipboardData?.files||[])
      if(pasted.length){e.preventDefault();setQueued(current=>[...current,...pasted]);notify?.('Screenshot added to Quick Capture.')}
    }
    window.addEventListener('paste',onPaste)
    return()=>window.removeEventListener('paste',onPaste)
  },[])

  function addFiles(list){setQueued(current=>[...current,...Array.from(list||[])])}
  function removeFile(index){setQueued(current=>current.filter((_,i)=>i!==index))}

  async function save(e){
    e.preventDefault()
    if(!queued.length&&!note.trim())return notify?.('Add a note, link, screenshot or file first.')
    setBusy(true)
    const isUrl=!queued.length&&/^https?:\/\//i.test(note.trim())
    const captureType=queued.length?(queued.every(f=>f.type.startsWith('image/'))?'image':'file'):(isUrl?'link':'text')
    const {data:capture,error:captureError}=await supabase.from('quick_capture').insert({
      user_id:session.user.id,
      capture_type:captureType,
      title:title.trim()||null,
      content:isUrl?null:(note.trim()||null),
      source_url:isUrl?note.trim():null,
      subject_slug:subject||null,
      processed:false
    }).select().single()
    if(captureError){setBusy(false);return notify?.(captureError.message)}

    for(let i=0;i<queued.length;i++){
      const file=queued[i]
      const path=`${session.user.id}/captures/${capture.id}/${String(i+1).padStart(2,'0')}-${Date.now()}-${safeFileName(file.name)}`
      const {error:storageError}=await supabase.storage.from('user-files').upload(path,file,{upsert:false})
      if(storageError){notify?.(storageError.message);continue}
      const {error:fileError}=await supabase.from('user_files').insert({
        user_id:session.user.id,capture_id:capture.id,subject_slug:subject||null,storage_path:path,
        original_name:file.name,mime_type:file.type,size_bytes:file.size,file_type:fileKind(file)
      })
      if(fileError)notify?.(fileError.message)
    }
    setBusy(false);setQueued([]);setTitle('');setSubject('');setNote('');await loadAll();notify?.('Captured. You can organise it later.')
  }

  const recent=captures.slice(0,8)
  return <div className="qc-shell">
    <section className="qc-intro"><div><span>Capture now, organise later</span><h2>Add anything to Kellyn Hub</h2><p>Photograph a paper handout, paste a screenshot, drag in a file, upload a document or save a web link. Naming and subject are optional.</p></div><div className="qc-shortcut"><Clipboard/><strong>Windows screenshot</strong><span>Win + Shift + S, then Ctrl + V here.</span></div></section>

    <div className="qc-grid">
      <form className="qc-capture" onSubmit={save} onDragEnter={e=>{e.preventDefault();setDrag(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}>
        <div className="qc-actions">
          <button type="button" onClick={()=>inputRef.current?.click()}><Upload/><span>Upload files</span></button>
          <button type="button" onClick={()=>cameraRef.current?.click()}><Camera/><span>Take photo</span></button>
          <button type="button" onClick={()=>navigator.clipboard?.readText().then(text=>text&&setNote(text)).catch(()=>notify?.('Use Ctrl + V or Paste in the text box.'))}><Clipboard/><span>Paste text</span></button>
        </div>
        <input ref={inputRef} className="qc-hidden" type="file" multiple accept="image/*,.heic,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={e=>addFiles(e.target.files)}/>
        <input ref={cameraRef} className="qc-hidden" type="file" accept="image/*" capture="environment" onChange={e=>addFiles(e.target.files)}/>

        <div className={`qc-drop ${drag?'active':''}`} onClick={()=>inputRef.current?.click()}>
          <Upload size={28}/><strong>Drag and drop files here</strong><span>or tap to choose files</span><small>Images, HEIC, PDF, Word, PowerPoint and spreadsheets supported for storage.</small>
        </div>

        {queued.length>0&&<div className="qc-queued"><div className="qc-queued-head"><strong>{queued.length} file{queued.length===1?'':'s'} ready</strong><span>{queued.length>1?'These can be saved together as one capture.':''}</span></div>{queued.map((file,index)=><div className="qc-file" key={`${file.name}-${index}`}>{file.type.startsWith('image/')?<Image/>:<File/>}<span><strong>{file.name}</strong><small>{Math.max(1,Math.round(file.size/1024))} KB</small></span><button type="button" onClick={()=>removeFile(index)}>Remove</button></div>)}</div>}

        <label>Quick note or web link<textarea rows="4" value={note} onChange={e=>setNote(e.target.value)} placeholder="Paste teacher instructions, a note, or a useful web link"/></label>
        <div className="qc-fields"><label>Short title <span>optional</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Law handout"/></label><label>Subject <span>optional</span><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Organise later</option>{subjects.map(s=><option value={s.slug} key={s.slug}>{s.short_name}</option>)}</select></label></div>
        <button className="qc-save" disabled={busy}><Plus/>{busy?'Saving…':'Save capture'}</button>
        <p className="qc-boundary">The Hub stores the original material privately. Automatic subject/deadline detection is a later step and will ask Kellyn to confirm uncertain information rather than silently guessing.</p>
      </form>

      <section className="qc-recent"><h2>Recent captures</h2>{recent.map(c=>{
        const attached=files.filter(f=>f.capture_id===c.id)
        return <article key={c.id}><span className="qc-kind">{c.capture_type==='link'?<Link2/>:c.capture_type==='image'?<Image/>:<File/>}</span><div><strong>{c.title||c.source_url||attached[0]?.original_name||'Quick capture'}</strong><small>{c.subject_slug||'Unsorted'} · {new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(c.created_at))}</small>{c.content&&<p>{c.content}</p>}{attached.length>0&&<span className="qc-attachments">{attached.length} file{attached.length===1?'':'s'} attached</span>}</div></article>})}{!recent.length&&<div className="qc-empty">Nothing captured yet.</div>}</section>
    </div>
  </div>
}
