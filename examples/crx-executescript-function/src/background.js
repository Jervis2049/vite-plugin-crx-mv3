function setBgColor() {
  document.body.style.backgroundColor = '#f00'
  document.body.style.filter = 'blur(5px)'
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url?.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: setBgColor
    })
  }
})
