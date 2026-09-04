import React,{useEffect,useMemo,useState} from 'react'
import {BookOpen,CheckSquare,FolderOpen,Target} from 'lucide-react'
import {supabase} from './supabase.js'
import {chunkKnowledge,suggestKnowledgeClassification} from './libraryKnowledge.js'
import './capture-purpose-router.css'

function captureSource(c){
  if(c?.source_url)return c.source_url
  const match=String(c?.content||'').match(/(?:Source:\s*)?(https?:\/\/[^\s]+)/i)
  return match?.[1]||null
}
function captureText(c){
  let value=String(c?.extracted_text||c?.content||'').replace(/(?:^|\n)Source:\s*https?:\/\/[^\s]+/ig,'').trim()
  if(/^https?:\/\/\S+$/i.test(value))value=''
  return value||null
}
function suggestion(c){
  if(c?.suggested_type==='teacher_feedback')return'improve'
  if(c?.suggested_type==='school_task')return'do'
  return'learn'
}

export default function CapturePurposeRouter({capture,files=[],session,notify,loadAll,go}){
  const [items,setItems]=useState([])
  const [busy,setBusy]=useState('')
  const uid=session?.user?.id
  const attached=useMemo(()=>files.filter(f=>f.capture_id===capture.id),[files,capture.id])
  const suggested=suggestion(capture)

  useEffect(()=>{
    if(!uid)return
    supabase.from('library_items').select('*').eq('user_id',uid).eq('capture_id',capture.id).eq('status','active').then(({data,error})=>{if(error)notify?.(error.message);else setItems(data||[])})
  },[uid,capture.id])

  async function route(purpose){
    if(!uid||items.some(x=>x.purpose===purpose))return
    setBusy(purpose)
    const subjectHint=capture.subject_slug||capture.suggested_subject_slug||null
    const sourceUrl=captureSource(capture)
    const extracted=captureText(capture)
    const title=capture.title||attached[0]?.original_name||'Captured resource'
    const classification=extracted?suggestKnowledgeClassification(extracted,title,subjectHint):{subject_slug:subjectHint,unit_slug:null,topic_slug:null,tags:[]}
    const subjectSlug=subjectHint||classification.subject_slug||null
    const summary=extracted?extracted.replace(/\s+/g,' ').trim().slice(0,650):`Original ${capture.capture_type||'capture'} saved in Kellyn Hub.`
    const now=new Date().toISOString()
    const {data:item,error:itemError}=await supabase.from('library_items').insert({
      user_id:uid,capture_id:capture.id,subject_slug:subjectSlug,title,purpose,
      resource_type:capture.suggested_type||capture.capture_type||'resource',source_url:sourceUrl,summary,extracted_text:extracted,
      extraction_status:extracted?'needs_review':'pending',extraction_method:capture.extraction_method||(extracted?'captured_text':null),extracted_at:extracted?(capture.extracted_at||now):null,
      classification_status:'suggested',suggested_subject_slug:classification.subject_slug,suggested_unit_slug:classification.unit_slug,suggested_topic_slug:classification.topic_slug,tags:classification.tags||[]
    }).select().single()
    if(itemError){setBusy('');return notify?.(itemError.message)}
    let finalItem=item

    if(extracted){
      const chunks=chunkKnowledge(extracted).map((content,index)=>({user_id:uid,library_item_id:item.id,chunk_index:index,content,source_label:title}))
      for(let i=0;i<chunks.length;i+=100){
        const {error}=await supabase.from('library_chunks').insert(chunks.slice(i,i+100))
        if(error){notify?.('Saved to Library, but searchable text could not be prepared yet.');break}
      }
    }

    if(purpose==='do'){
      const dueAt=capture.suggested_due_date?new Date(`${capture.suggested_due_date}T16:00:00`).toISOString():null
      const description=[extracted,sourceUrl?`Source: ${sourceUrl}`:''].filter(Boolean).join('\n\n')||'Created from a Kellyn Hub capture. Open the original attachment for the teacher instructions.'
      const {data:task,error:taskError}=await supabase.from('tasks').insert({user_id:uid,subject_slug:subjectSlug,title,description,due_at:dueAt,next_action:'Open the original teacher instructions and identify exactly what needs to be completed.'}).select().single()
      if(taskError){await supabase.from('library_items').delete().eq('id',item.id);setBusy('');return notify?.(taskError.message)}
      const steps=['Read the original instructions and identify what the teacher is asking.','Check the deadline, command word and what needs to be submitted.','Gather the relevant notes, sources or teacher guidance.','Make a simple plan in your own words and start the first section.']
      await supabase.from('task_steps').insert(steps.map((step,index)=>({task_id:task.id,user_id:uid,title:step,order_index:index,completed:false})))
      await supabase.from('user_files').update({task_id:task.id,subject_slug:subjectSlug}).eq('user_id',uid).eq('capture_id',capture.id)
      const {data:updated}=await supabase.from('library_items').update({linked_task_id:task.id}).eq('id',item.id).select().single()
      if(updated)finalItem=updated
    }

    if(purpose==='improve'){
      const target=extracted?extracted.slice(0,1000):'Review the captured teacher feedback and identify one specific improvement to practise next.'
      const {error}=await supabase.from('feedback_targets').insert({user_id:uid,capture_id:capture.id,library_item_id:item.id,subject_slug:subjectSlug,title:`Improve: ${title}`,target})
      if(error)notify?.('Saved to Library, but the feedback target could not be created.')
    }

    await supabase.from('quick_capture').update({library_status:'partly_processed',library_processed_at:now}).eq('id',capture.id).eq('user_id',uid)
    setItems(current=>[finalItem,...current])
    setBusy('')
    await loadAll?.()
    notify?.(purpose==='do'?'Added to My Work and My Library.':purpose==='improve'?'Saved as feedback to improve from.':purpose==='learn'?'Added to the Learning Library.':'Saved as a reference in My Library.')
  }

  const filed=items.map(x=>x.purpose)
  return <div className="capture-router">
    <div className="capture-router-head"><span><strong>Use this capture</strong><small>Suggested: {suggested==='do'?'Schoolwork':suggested==='improve'?'Teacher feedback':'Learning resource'}</small></span>{filed.length>0&&<button type="button" onClick={()=>go?.('library')}>Filed · view library</button>}</div>
    <div className="capture-router-actions">
      <button type="button" className={filed.includes('learn')?'done':suggested==='learn'?'suggested':''} disabled={filed.includes('learn')||busy==='learn'} onClick={()=>route('learn')}><BookOpen/><span>{busy==='learn'?'Adding…':'Learn'}</span><small>Use for revision</small></button>
      <button type="button" className={filed.includes('do')?'done':suggested==='do'?'suggested':''} disabled={filed.includes('do')||busy==='do'} onClick={()=>route('do')}><CheckSquare/><span>{busy==='do'?'Adding…':'Do'}</span><small>Create My Work</small></button>
      <button type="button" className={filed.includes('improve')?'done':suggested==='improve'?'suggested':''} disabled={filed.includes('improve')||busy==='improve'} onClick={()=>route('improve')}><Target/><span>{busy==='improve'?'Adding…':'Improve'}</span><small>Teacher feedback</small></button>
      <button type="button" className={filed.includes('keep')?'done':''} disabled={filed.includes('keep')||busy==='keep'} onClick={()=>route('keep')}><FolderOpen/><span>{busy==='keep'?'Adding…':'Keep'}</span><small>Reference</small></button>
    </div>
  </div>
}
