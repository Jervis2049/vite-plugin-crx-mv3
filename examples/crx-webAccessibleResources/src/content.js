/**
 * No need to use chrome.runtime.getURL for image path handling.
 */
import ChromeLogo from './Chrome-Logo.png'
console.log(ChromeLogo) // chrome-extension://xxx/assets/Chrome-Logo.hashxxx.png

/**
 * html file
 */
const iframeUrl = chrome.runtime.getURL('iframe.html')
const iframe = document.createElement('iframe')
iframe.src = iframeUrl
;(document.head || document.documentElement).appendChild(iframe)
console.log(iframeUrl)

const style = chrome.runtime.getURL('style.less')
console.log(style)

/**
 * injected.js
 */
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.ts')
;(document.head || document.documentElement).appendChild(script)
