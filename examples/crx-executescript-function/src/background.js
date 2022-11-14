function reddenPage() {
  document.body.style.backgroundColor = '#f00';
}

chrome.action.onClicked.addListener((tab) => {  
  if(!tab.url.includes("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: reddenPage
    });
  }
});
