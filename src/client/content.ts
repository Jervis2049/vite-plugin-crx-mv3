import { UPDATE_CONTENT, RELOAD, VITE_PLUGIN_CRX_MV3 } from '../constants'

const ws = new WebSocket(`ws://localhost:${PORT}/${MENIFEST_NAME}/crx`)
let timer

ws.onopen = function () {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    ws.send(JSON.stringify({ type: 'ping' }))
  }, 5000)
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection established`)
}
ws.onmessage = function (e) {
  if (e.data === UPDATE_CONTENT && chrome.runtime?.id) {
    chrome.runtime.sendMessage({ msg: RELOAD }, () => {
      if (RELOADPAGE) window.location.reload()
      else
        console.log(
          `[${VITE_PLUGIN_CRX_MV3}] extension reload, pls refresh the page manually`
        )
    })
  }
}
ws.onclose = function () {
  if (timer) clearInterval(timer)
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection closed.`)
}
