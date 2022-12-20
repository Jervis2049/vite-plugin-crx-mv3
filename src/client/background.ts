import { RELOAD } from '../constants'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == RELOAD) {
    chrome.runtime.reload()
    sendResponse()
  }
})
