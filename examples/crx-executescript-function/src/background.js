function setBgColor() {
  document.body.style.backgroundColor = '#f00'
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url?.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: setBgColor
    })
  }
})
