import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import type { UserEarningsData } from "~background/messages/fetch-user-earnings"
import { MoxieEarnings } from "~ui/moxie-earnings"
import { determineTheme } from "~utils/determine-theme"
import { getFid } from "~utils/get-fid"

export const config: PlasmoCSConfig = {
  matches: ["https://warpcast.com/*"],
  css: ["inter-font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const selectors = [
  "#root > div > div > div > aside.h-full > div.w-full > form"
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element
  }))
}

async function fetchUserEarnings(fid: number) {
  try {
    const resp = await sendToBackground({
      name: "fetch-user-earnings",
      body: { fid }
    })
    return resp as { data?: UserEarningsData }
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

function UserEarningsComponent({ fid }: { fid: number }) {
  const [userEarnings, setUserEarnings] = useState<UserEarningsData | null>(
    null
  )

  const fetchAndSetUserEarnings = useCallback(async () => {
    const earnings = await fetchUserEarnings(fid)
    setUserEarnings(earnings.data)
  }, [fid])

  useEffect(() => {
    fetchAndSetUserEarnings()
    const interval = setInterval(fetchAndSetUserEarnings, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAndSetUserEarnings])

  return (
    <div className="w-full mt-3 rounded-lg px-2 py-3 pt-1.5 bg-black/[.04] dark:bg-white/[.04]">
      <div className="px-2 py-1 text-lg font-semibold">Your Moxie earnings</div>
      <div className="px-2 py-1 flex flex-col gap-2">
        <MoxieEarnings earnings={userEarnings?.today} title="Today" />
        <MoxieEarnings earnings={userEarnings?.weekly} title="Last 7 days" />
        <MoxieEarnings earnings={userEarnings?.lifetime} title="All time" />
      </div>
    </div>
  )
}

export const render: PlasmoRender<any> = async (
  { anchor, createRootContainer },
  InlineCSUIContainer
) => {
  if (!anchor || !createRootContainer) {
    return
  }
  const rootContainer = await createRootContainer(anchor)
  const root = createRoot(rootContainer)

  const theme = determineTheme(window)

  const parentStyle = anchor.element.parentElement?.style
  parentStyle?.setProperty("flex-wrap", "wrap")
  parentStyle?.setProperty("row-gap", "0")

  const fid = await getFid(window)

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      <div className={`flex w-full ${theme}`} style={{ fontFamily: "Inter" }}>
        <UserEarningsComponent fid={fid} />
      </div>
    </InlineCSUIContainer>
  )
}
