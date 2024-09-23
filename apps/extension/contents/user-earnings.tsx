import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import type {
  UserEarningsData,
  UserEarningStat
} from "~background/messages/fetch-user-earnings"
import { DecimalNumber } from "~ui/decimal-number"
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

function MoxieSimpleIcon() {
  return (
    <svg
      className="h-[11px] w-auto fill-moxie-500 leading-[11px]"
      viewBox="0 0 25 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H7.2L11.966 6.742H12.204L16.971 0H24.17V22.253H17.07V10.138H16.891L12.215 16.305H11.977L7.3 10.138H7.121V22.253H0.0209999V0H0Z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-3">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  )
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

function MoxieEarnings({
  earnings,
  title
}: {
  earnings?: UserEarningStat
  title: string
}) {
  const [expanded, setExpanded] = useState(false)

  const handleToggleExpand = useCallback(
    () => setExpanded((e) => !e),
    [setExpanded]
  )

  return (
    <div className="flex flex-col">
      <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-between">
        <div className="text-sm text-muted">{title}</div>
        <button
          className="text-base text-default flex items-baseline gap-1"
          onClick={handleToggleExpand}>
          <MoxieSimpleIcon />
          {earnings ? (
            <DecimalNumber value={earnings.allEarningsAmount} />
          ) : (
            <small style={{ opacity: 0.75 }}>N/A</small>
          )}
          <div
            className={`flex items-center justify-center ${expanded ? "rotate-180" : ""} transition-transform`}>
            <ChevronDownIcon />
          </div>
        </button>
      </div>
      {expanded && earnings && (
        <div className="w-full pl-10 pr-4">
          <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-end">
            <div className="text-xs text-muted">Casts</div>
            <div className="text-sm text-default flex items-baseline gap-1">
              <DecimalNumber value={earnings.castEarningsAmount} />
            </div>
          </div>
          <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-end">
            <div className="text-xs text-muted">Frames</div>
            <div className="text-sm text-default flex items-baseline gap-1">
              <DecimalNumber value={earnings.frameDevEarningsAmount} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
