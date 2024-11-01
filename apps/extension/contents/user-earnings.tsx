import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"

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

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

const voteLink =
  "https://snapshot.box/#/s:moxie.eth/proposal/0x82a8b1b8a2bd77d3b706b8cd0c80d1d12947a63cd20630e44d44f960e67be5a4"
const votingCloseDate = new Date("2024-11-07T15:25:00Z").getTime()

function pluralize(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? "" : "s"}`
}

function UserEarningsComponent({ fid }: { fid: number }) {
  const [userEarnings, setUserEarnings] = useState<UserEarningsData | null>(
    null
  )
  const [showVotePlea, setShowVotePlea, { isLoading: isLoadingShowVotePlea }] =
    useStorage("showVotePlea", true)

  const fetchAndSetUserEarnings = useCallback(async () => {
    const earnings = await fetchUserEarnings(fid)
    setUserEarnings(earnings.data)
  }, [fid])

  useEffect(() => {
    fetchAndSetUserEarnings()
    const interval = setInterval(fetchAndSetUserEarnings, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAndSetUserEarnings])

  const handleHideVotePlea = () => {
    setShowVotePlea(false)
  }

  const votingClosed = Date.now() > votingCloseDate
  const minutesUntilVotingCloses = Math.ceil(
    (votingCloseDate - Date.now()) / (1000 * 60)
  )

  return (
    <div className="w-full mt-3 rounded-lg px-2 py-3 pt-1.5 bg-black/[.04] dark:bg-white/[.04]">
      <div className="px-2 py-1 text-lg font-semibold">Your Moxie earnings</div>
      {showVotePlea && !votingClosed && !isLoadingShowVotePlea && (
        <div className="px-2 py-1 mb-2">
          <div className="text-sm bg-moxie-500 text-white rounded-lg px-4 py-3 relative">
            <button
              className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center"
              onClick={handleHideVotePlea}>
              <XIcon />
            </button>
            <div className="pr-6 max-w-prose flex flex-col gap-1">
              <h2 className="text-base font-semibold">
                Moxie Retro1 Grant voting is now open!
              </h2>
              <p className="text-white">
                {"If you like the Moxie extension, please consider voting for "}
                <span className="font-bold text-white">6. ds8</span>
                {" — the maker of the extension."}
              </p>
            </div>
            <div className="flex flex-row justify-between gap-2 items-center mt-2">
              <div className="text-white/70 text-xs">
                {"Voting closes in "}
                <span className="font-bold">
                  {minutesUntilVotingCloses > 1440
                    ? pluralize(
                        Math.floor(minutesUntilVotingCloses / 1440),
                        "day"
                      )
                    : minutesUntilVotingCloses > 60
                      ? pluralize(
                          Math.floor(minutesUntilVotingCloses / 60),
                          "hour"
                        )
                      : pluralize(minutesUntilVotingCloses, "minute")}
                </span>
              </div>
              <a
                href={voteLink}
                target="_blank"
                rel="noreferrer noopener"
                className="flex border border-white rounded-lg px-3 py-1 text-white font-semibold bg-black/[.04] hover:opacity-80 transition-opacity duration-200">
                Go vote
              </a>
            </div>
          </div>
        </div>
      )}
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
