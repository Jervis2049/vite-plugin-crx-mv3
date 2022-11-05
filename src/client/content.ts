import { UPDATE_CONTENT, RELOAD, VITE_PLUGIN_CRX_MV3 } from '../constants'

const ws = new WebSocket(`ws://localhost:${PORT}/crx`)

ws.onopen = function () {
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection established`)
}
ws.onmessage = function (e) {
  if (e.data === UPDATE_CONTENT && chrome.runtime?.id) {
    chrome.runtime.sendMessage({ msg: RELOAD }, () => {
      window.location.reload()
    })
  }
}
ws.onclose = function () {
  console.log(`[${VITE_PLUGIN_CRX_MV3}] connection closed.`)
}
