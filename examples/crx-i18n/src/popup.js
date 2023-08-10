import './style.css'

const $text = document.querySelector('.text')
if ($text) {
  $text.innerHTML = chrome.i18n.getMessage('popupText')
}

///////////////////////////////api testing/////////////////////////
console.log('getUILanguage:', chrome.i18n.getUILanguage())
console.log('@@extension_id:', chrome.i18n.getMessage('@@extension_id'))
console.log('@@ui_locale:', chrome.i18n.getMessage('@@ui_locale'))
console.log(
  '@@bidi_reversed_dir:',
  chrome.i18n.getMessage('@@bidi_reversed_dir')
)

chrome.i18n.getAcceptLanguages(function (languageArray) {
  console.log('getAcceptLanguages:', languageArray)
})

function detectLanguage(inputText) {
  chrome.i18n.detectLanguage(inputText, function (result) {
    let outputLang = '检测到的语言: '
    let outputPercent = '语言占比: '
    for (const item of result.languages) {
      outputLang += item.language + ' '
      outputPercent += item.percentage + ' '
    }
    console.log(outputLang, outputPercent)
  })
}
detectLanguage('哈哈哈哈')
