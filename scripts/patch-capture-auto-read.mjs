import fs from 'node:fs'

function replaceOnce(text,from,to,label){
  if(text.includes(to))return text
  if(!text.includes(from))throw new Error(`Could not find ${label}`)
  return text.replace(from,to)
}

let qc=fs.readFileSync('src/QuickCaptureV2.jsx','utf8')
qc=replaceOnce(qc,"import './phase2-capture.css'\n","import './phase2-capture.css'\nimport './capture-auto-read.css'\n",'capture OCR css import')
qc=replaceOnce(qc,"  const [openingFileId,setOpeningFileId]=useState(null)\n","  const [openingFileId,setOpeningFileId]=useState(null)\n  const [readProgress,setReadProgress]=useState('')\n",'capture OCR progress state')

const saveStart=qc.indexOf('  async function save(e){')
const saveEnd=qc.indexOf('\n\n  const recent=',saveStart)
if(saveStart<0||saveEnd<0)throw new Error('Could not locate Quick Capture save function')
const newSave=[
"  async function save(e){",
"    e.preventDefault()",
"    if(!queued.length&&!note.trim())return notify?.('Add a note, link, screenshot or file first.')",
"    setBusy(true);setReadProgress('')",
"    const isUrl=!queued.length&&/^https?:\\/\\//i.test(note.trim())",
"    const captureType=queued.length?(queued.every(f=>(f.type||'').startsWith('image/'))?'image':'file'):(isUrl?'link':'text')",
"    let readResult={text:'',method:null,pageCount:null,note:null}",
"    if(queued.length){",
"      try{",
"        setReadProgress('Reading the capture…')",
"        const {readCaptureFiles}=await import('./captureAutoRead.js')",
"        readResult=await readCaptureFiles(queued,label=>setReadProgress(label))",
"      }catch(error){readResult={text:'',method:null,pageCount:null,note:error?.message||'Automatic reading failed.'}}",
"    } else if(!isUrl&&note.trim()){readResult={text:note.trim(),method:'captured_text',pageCount:null,note:null}}",
"    const classificationText=[note.trim(),readResult.text].filter(Boolean).join('\\n\\n')",
"    const finalSuggestion=classify(title,classificationText,queued)",
"    const finalSubject=subject||null",
"    const extracted=readResult.text||null",
"    const extractionStatus=extracted?'needs_review':queued.length?'failed':isUrl?'pending':'ready'",
"    setReadProgress(extracted?'Saving extracted text…':'Saving capture…')",
"    const {data:capture,error:captureError}=await supabase.from('quick_capture').insert({",
"      user_id:session.user.id,capture_type:captureType,title:title.trim()||null,content:isUrl?null:(note.trim()||null),source_url:isUrl?note.trim():null,subject_slug:finalSubject,processed:accepted,",
"      suggested_subject_slug:finalSuggestion.subject,suggested_type:finalSuggestion.type,suggested_due_date:finalSuggestion.due,classification_confidence:finalSuggestion.confidence,",
"      extracted_text:extracted,extraction_status:extractionStatus,extraction_method:readResult.method,extracted_at:extracted?new Date().toISOString():null,extraction_note:readResult.note",
"    }).select().single()",
"    if(captureError){setBusy(false);setReadProgress('');return notify?.(captureError.message)}",
"    for(let i=0;i<queued.length;i++){",
"      const original=queued[i],file=enhance?await enhanceImage(original):original",
"      const path=session.user.id+'/captures/'+capture.id+'/'+String(i+1).padStart(2,'0')+'-'+Date.now()+'-'+safeFileName(file.name)",
"      const {error:storageError}=await supabase.storage.from('user-files').upload(path,file,{upsert:false});if(storageError){notify?.(storageError.message);continue}",
"      const {error:fileError}=await supabase.from('user_files').insert({user_id:session.user.id,capture_id:capture.id,subject_slug:finalSubject,storage_path:path,original_name:original.name,mime_type:file.type,size_bytes:file.size,file_type:finalSuggestion.type==='teacher_feedback'?'teacher_feedback':fileKind(original)});if(fileError)notify?.(fileError.message)",
"    }",
"    setBusy(false);setReadProgress('');setQueued([]);setTitle('');setSubject('');setNote('');setAccepted(false);await loadAll()",
"    notify?.(extracted?'Captured and text extracted. Choose how Kellyn Hub should use it.':readResult.note?'Captured, but text could not be extracted. The original is still safely stored.':accepted?'Captured and classified.':'Captured. The original is safely stored.')",
"  }"
].join('\n')
qc=qc.slice(0,saveStart)+newSave+qc.slice(saveEnd)

qc=replaceOnce(qc,
"        <button className=\"qc-save\" disabled={busy}><Plus/>{busy?'Saving…':'Save capture'}</button><p className=\"qc-boundary\">Classification uses the text, title and file names available in the capture. Image-only documents are not silently guessed. Kellyn can confirm or change the result.</p>",
"        {busy&&readProgress&&<div className=\"qc-auto-read\"><ScanLine/><span><strong>Reading this capture</strong>{readProgress}</span></div>}<button className=\"qc-save\" disabled={busy}><Plus/>{busy?'Working…':'Save capture'}</button><p className=\"qc-boundary\">Screenshots, images and PDFs are read automatically when saved. Kellyn Hub keeps the original, stores the extracted text separately, and still asks Kellyn to confirm how the material should be used and filed.</p>",
'capture OCR progress UI')

qc=replaceOnce(qc,
"{c.content&&<p className=\"qc-recent-content\">{c.content}</p>}",
"{c.content&&<p className=\"qc-recent-content\">{c.content}</p>}{c.extracted_text&&<div className=\"qc-read-result\"><strong>Text read from capture</strong><p>{c.extracted_text.slice(0,700)}{c.extracted_text.length>700?'…':''}</p></div>}{c.extraction_status==='failed'&&<p className=\"qc-read-failed\">The original was saved, but text could not be read automatically. It can be retried from My Library.</p>}",
'capture OCR recent preview')
fs.writeFileSync('src/QuickCaptureV2.jsx',qc)

let router=fs.readFileSync('src/CapturePurposeRouter.jsx','utf8')
router=replaceOnce(router,
"  let value=String(c?.content||'').replace(/(?:^|\\n)Source:\\s*https?:\\/\\/[^\\s]+/ig,'').trim()",
"  let value=String(c?.extracted_text||c?.content||'').replace(/(?:^|\\n)Source:\\s*https?:\\/\\/[^\\s]+/ig,'').trim()",
'router extracted text preference')
router=replaceOnce(router,
"    const {data:item,error:itemError}=await supabase.from('library_items').insert({user_id:uid,capture_id:capture.id,subject_slug:subjectSlug,title,purpose,resource_type:capture.suggested_type||capture.capture_type||'resource',source_url:sourceUrl,summary,extracted_text:extracted}).select().single()",
"    const {data:item,error:itemError}=await supabase.from('library_items').insert({user_id:uid,capture_id:capture.id,subject_slug:subjectSlug,title,purpose,resource_type:capture.suggested_type||capture.capture_type||'resource',source_url:sourceUrl,summary,extracted_text:extracted,extraction_status:extracted?'needs_review':'pending',extraction_method:capture.extraction_method||(extracted?'captured_text':null),extracted_at:extracted?(capture.extracted_at||new Date().toISOString()):null,suggested_subject_slug:capture.suggested_subject_slug||null}).select().single()",
'router extraction metadata')
fs.writeFileSync('src/CapturePurposeRouter.jsx',router)
