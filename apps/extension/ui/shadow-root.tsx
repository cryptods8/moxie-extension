import cssText from "data-text:~style.css"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { determineTheme } from "~utils/determine-theme"

export function ShadowRoot({ children }) {
  const hostRef = useRef(null)
  const [shadowRoot, setShadowRoot] = useState(null)

  useEffect(() => {
    if (hostRef.current) {
      const root = hostRef.current.attachShadow({ mode: "open" })
      const styleElement = document.createElement("style")
      styleElement.textContent = cssText
      root.appendChild(styleElement)
      setShadowRoot(root)
    }
  }, [])

  return (
    <div ref={hostRef}>
      {shadowRoot &&
        createPortal(
          <div className={determineTheme(window)}>{children}</div>,
          shadowRoot
        )}
    </div>
  )
}
