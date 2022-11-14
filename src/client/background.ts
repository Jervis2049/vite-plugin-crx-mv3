import { UPDATE_SERVICE_WORK, RELOAD, VITE_PLUGIN_CRX_MV3 } from '../constants'

const ws = new WebSocket(`ws://localhost:${PORT}/crx`)

let timer

ws.onopen = function () {
  if(timer) clearInterval(timer)
  timer = setInterval(()=>{
    ws.send(JSON.stringify({type:'ping'}))
  },5000)
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection established`)
}
ws.onmessage = function (e) {  
  console.log(e);
  if (e.data === UPDATE_SERVICE_WORK && chrome.runtime?.id) {
    chrome.runtime.reload()
    chrome.tabs.reload()
  }
}
ws.onclose = function () {
  if(timer) clearInterval(timer)
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection closed.`)
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == RELOAD) {
    chrome.runtime.reload()
    chrome.tabs.reload()
    sendResponse()
  }
})
