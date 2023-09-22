let isToggled = false

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url?.startsWith('chrome://')) {
    // executeScript
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['executeScript.js']
    })
    // insertCSS | removeCSS
    if (!isToggled) {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['inject.css']
      })
      isToggled = true
    } else {
      chrome.scripting.removeCSS({
        target: { tabId: tab.id },
        files: ['inject.css']
      })
      isToggled = false
    }
  }
})

// chrome.runtime.onInstalled.addListener(function () {
//   chrome.scripting.registerContentScripts([
//     {
//       id: 'session-script',
//       js: ['registerContentScript.js'],
//       css: ['test.css'],
//       persistAcrossSessions: false,
//       matches: ['<all_urls>'],
//       runAt: 'document_start'
//     }
//   ])
// })
