
chrome.action.onClicked.addListener((tab) => {    
  if(!tab.url.includes("chrome://")) {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["css/dynamicStyle.less"]
    });
  }
});
