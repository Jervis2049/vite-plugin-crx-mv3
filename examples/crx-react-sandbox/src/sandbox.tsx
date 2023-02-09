import ReactDOM from 'react-dom'
 
window.addEventListener("message", async function (event) {
  const source = event.source as {
    window: WindowProxy
  }
  source.window.postMessage(eval(event.data), event.origin)
})


ReactDOM.render(
  <div
    style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      HELLO SANDBOX
  </div>,
  document.getElementById('app')
)