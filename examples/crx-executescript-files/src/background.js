
chrome.action.onClicked.addListener((tab) => {    
  if(!tab.url.includes("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/dynamicScript.js"]
    });
  }
});
