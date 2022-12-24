

chrome.action.onClicked.addListener(async () => {
  let url = chrome.runtime.getURL('index.html')
  let tab = await chrome.tabs.create({ url })
  console.log(`Created tab ${tab.id}`)
})

