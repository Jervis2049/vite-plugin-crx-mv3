let isToggled = false
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.url.includes('chrome://')) {
      if (!isToggled) {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['css/dynamicStyle.less']
        })
        isToggled = true
      } else {
        await chrome.scripting.removeCSS({
          target: { tabId: tab.id },
          files: ['css/dynamicStyle.less']
        })
        isToggled = false
      }
    }
  } catch (err) {
    console.error(`failed to insert CSS: ${err}`)
  }
})
