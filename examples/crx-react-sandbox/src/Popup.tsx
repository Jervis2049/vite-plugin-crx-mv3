import { useEffect, useRef, useState } from "react"

function Popup() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [count, setCount] = useState("");

  useEffect(() => {
    window.addEventListener("message", (event) => {
      setCount(event.data)
      console.log("EVAL output: " + event.data)
    })
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 12,
        width: 175
      }}>
      <button
        onClick={() => {
          setCount(count + 1)
          iframeRef.current?.contentWindow?.postMessage("10 + 20", "*")
        }}>
        Trigger iframe eval
      </button>
      <div style={{marginTop:5}}>
        Use eval to execute "10 + 20": {count}
      </div>
      <iframe src="sandbox.html" ref={iframeRef} style={{ display: "none" }} />
    </div>
  )
}

export default Popup