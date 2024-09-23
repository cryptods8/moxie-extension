import * as HoverCard from "@radix-ui/react-hover-card"
import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import type { FanTokenData } from "~background/messages/fetch-fan-tokens"
import type { FidData } from "~background/messages/fetch-fid-from-handle"
import type {
  UserEarningsData,
  UserEarningStat
} from "~background/messages/fetch-user-earnings"
import { DecimalNumber } from "~ui/decimal-number"
import { determineTheme } from "~utils/determine-theme"
import { getFid } from "~utils/get-fid"
import * as storage from "~utils/storage"

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
  "#root > div > div > div > main > div > div > div > div > div > div > div > div > span > a > div > img",
  "#root > div > div > div > main > div > div > div > div > div > div > div > div > span > a > img"
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element
  }))
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

async function fetchFanTokens(fid: number) {
  try {
    const resp = await sendToBackground({
      name: "fetch-fan-tokens",
      body: { fid }
    })
    return resp as { data?: FanTokenData }
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

async function getFanTokens(window: Window, handle: string) {
  const myFid = await getFid(window)
  if (!myFid) {
    return null
  }
  const fanTokens = await fetchFanTokens(myFid)
  const data = fanTokens?.data
  if (!data) {
    return null
  }
  const fanToken = data.fanTokens.find(
    (ft) => ft.type === "USER" && ft.username === handle
  )
  const fan = data.fans.find((ft) => ft.username === handle)
  return {
    fanToken,
    fan
  }
}

function FanTokenIcon() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 194 194"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M121.811 66.6017L96.8333 16L71.8558 66.6017L16 74.7658L56.4167 114.132L46.8783 169.745L96.8333 143.474L146.788 169.745L137.25 114.132L177.667 74.7658L121.811 66.6017ZM86.4903 79H71.0452V127H86.3203V100.868H86.7054L96.7676 114.17H97.2797L107.34 100.868H107.725V127H123V79H107.512L97.256 93.5426H96.744L86.4903 79Z"
        fill="#6A2DE0"
      />
    </svg>
  )
}

function FanIcon() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 194 194"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M177.667 68.7083C177.667 87.2192 165.461 101.365 153.417 113.167L96.8333 169.75L40.25 113.167C28.125 101.446 16 87.3 16 68.7083C16 56.9172 20.684 45.6091 29.0215 37.2715C37.3591 28.934 48.6673 24.25 60.4583 24.25C74.685 24.25 84.7083 28.2917 96.8333 40.4167C108.958 28.2917 118.982 24.25 133.208 24.25C144.999 24.25 156.308 28.934 164.645 37.2715C172.983 45.6091 177.667 56.9172 177.667 68.7083ZM85.7882 62H70.046V111H85.6149V84.3234H86.0074L96.2632 97.9028H96.7851L107.039 84.3234H107.431V111H123V62H107.214L96.7609 76.8455H96.2391L85.7882 62Z"
        fill="#6A2DE0"
      />
    </svg>
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

  const style = (rootContainer as HTMLElement).style

  const small = anchor.element.getBoundingClientRect().height < 48

  style.position = "absolute"
  style.bottom = small ? "-2px" : "-8px"
  style.left = small ? "-2px" : "-8px"

  let parent = anchor.element.parentElement
  while (parent && parent.tagName.toLowerCase() !== "a") {
    parent = parent.parentElement
  }
  const handle = parent?.getAttribute("href")?.split("/").pop()
  const fanTokens = handle ? await getFanTokens(window, handle) : null

  const { fanToken, fan } = fanTokens ?? {}

  const sizeClass = small ? "size-4" : "size-6 p-[1px]"

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      {(fanToken || fan) && (
        <div className={`flex w-full ${theme}`} style={{ fontFamily: "Inter" }}>
          <HoverCard.Root>
            <HoverCard.Trigger>
              <div
                className={`flex items-center justify-center bg-default-light dark:bg-default-dark rounded-full hover:scale-110 transition-transform duration-150 border-2 border-default-light dark:border-default-dark`}>
                <div className="flex items-center justify-center rounded-full bg-moxie-500/10 dark:bg-moxie-500/30">
                  {fanToken && (
                    <div className={`${sizeClass} z-10`}>
                      <FanTokenIcon />
                    </div>
                  )}
                  {fan && (
                    <div
                      className={sizeClass}
                      style={{
                        padding: small ? "1px" : "2px",
                        filter: "hue-rotate(90deg)",
                        marginLeft: fanToken ? (small ? "-6px" : "-10px") : 0
                      }}>
                      <FanIcon />
                    </div>
                  )}
                </div>
              </div>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content
                className={`HoverCardContent`}
                style={{ zIndex: 1001 }}
                sideOffset={5}>
                <div className="min-h-0 grow overflow-hidden rounded-lg px-6 py-4 shadow-md bg-app">
                  <div className="flex flex-col gap-4">
                    {fanToken && (
                      <div className="flex flex-row gap-2">
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            padding: "1px"
                          }}>
                          <FanTokenIcon />
                        </div>
                        <div>
                          <div className="text-default font-bold">
                            {"You are a fan!"}
                          </div>
                          <div className="text-muted text-xs">
                            {"Holding "}
                            <DecimalNumber
                              value={parseInt(fanToken.balance) / 1e18}
                            />
                            {" fan tokens"}
                          </div>
                        </div>
                      </div>
                    )}
                    {fanToken && fan && (
                      <div className="border-b border-default w-full" />
                    )}
                    {fan && (
                      <div className="flex flex-row gap-2">
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            padding: "2px",
                            filter: "hue-rotate(90deg)"
                          }}>
                          <FanIcon />
                        </div>
                        <div>
                          <div className="text-default font-bold">
                            {"They are your fan!"}
                          </div>
                          <div className="text-muted text-xs">
                            {"Holding "}
                            <DecimalNumber
                              value={parseInt(fan.balance) / 1e18}
                            />
                            {" fan tokens"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        </div>
      )}
    </InlineCSUIContainer>
  )
}
