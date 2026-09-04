const HUB='https://kellyhub.vercel.app/'
async function active(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab}
function openCapture(tab,text=''){
  const params=new URLSearchParams();if(tab?.title)params.set('title',tab.title);if(tab?.url)params.set('url',tab.url);if(text)params.set('text',text);chrome.tabs.create({url:`${HUB}?${params.toString()}#/capture`})
}

document.getElementById('screenshot').addEventListener('click',async()=>{
  const button=document.getElementById('screenshot')
  button.disabled=true
  button.textContent='Capturing…'
  try{
    const result=await chrome.runtime.sendMessage({type:'kellyn-capture-screenshot'})
    if(!result?.ok)throw new Error(result?.error||'Screenshot capture failed.')
    window.close()
  }catch(error){
    button.disabled=false
    button.textContent='Try screenshot again'
    button.title=error?.message||'Screenshot capture failed.'
  }
})

document.getElementById('page').addEventListener('click',async()=>openCapture(await active()))
document.getElementById('selection').addEventListener('click',async()=>{const tab=await active();try{const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.getSelection()?.toString()||''});openCapture(tab,result)}catch{openCapture(tab)}})
