const HUB='https://kellyhub.vercel.app/#/capture'
async function active(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab}
function openCapture(tab,text=''){
  const params=new URLSearchParams();if(tab?.title)params.set('title',tab.title);if(tab?.url)params.set('url',tab.url);if(text)params.set('text',text);chrome.tabs.create({url:`${HUB}?${params.toString()}`})
}
document.getElementById('page').addEventListener('click',async()=>openCapture(await active()))
document.getElementById('selection').addEventListener('click',async()=>{const tab=await active();try{const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.getSelection()?.toString()||''});openCapture(tab,result)}catch{openCapture(tab)}})
