/**
 * No need to use chrome.runtime.getURL for image path handling.
 */
import ChromeLogo from './Chrome-Logo.png'
console.log(ChromeLogo) //output: chrome-extension://xxx/assets/Chrome-Logo.hashxxx.png

/**
 * You need to declare "resources": ["injected.js"] in web_accessible_resources, this will output injected.js when packaged.
 */
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
;(document.head || document.documentElement).appendChild(s)

/**
 * html file
 */
const iframeUrl = chrome.runtime.getURL('iframe.html')
console.log(iframeUrl)
