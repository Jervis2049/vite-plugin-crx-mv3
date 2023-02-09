
chrome.action.onClicked.addListener(function() {  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    console.log('tabs',tabs);
    chrome.tabs.sendMessage(tabs[0].id, "toggle");
  })
});

