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

import type {
  CastType,
  EarningsData
} from "~background/messages/fetch-earnings"
import type { FarScoreData } from "~background/messages/fetch-far-score"
import { DecimalNumber } from "~ui/decimal-number"
import { MoxieLogo } from "~ui/moxie-logo"
import { determineTheme } from "~utils/determine-theme"
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
  '#root > div > div > div > main > div > div > div.fade-in > div > div > div.relative.p-4.pt-2 > div.flex.w-full.items-center > div > div > div:not([role="menuitem"]) > div:last-child',
  '#root > div > div > div > main > div > div > div.fade-in > div > div > div > div.relative.flex.flex-col > div > div > div.flex.flex-row.justify-between.gap-2 > div:not([role="menuitem"]) > a'
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element,
    insertPosition: "beforebegin"
  }))
}

interface CachedData<T> {
  data?: T
  timestamp: number
}

async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  { expiryInSeconds, force }: { expiryInSeconds: number; force?: boolean }
) {
  try {
    const cachedData = force ? null : await storage.get<CachedData<T>>(key)
    if (
      cachedData &&
      cachedData.timestamp > Date.now() - 1000 * expiryInSeconds
    ) {
      return cachedData.data
    }
    const data = await fetcher()
    await storage.set<CachedData<T>>(key, { data, timestamp: Date.now() })
    return data
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

async function fetchFarStats(handle: string) {
  return await cacheGet(
    `farStats/${handle}`,
    async () => {
      const resp = await sendToBackground({
        name: "fetch-far-score",
        body: { handle }
      })
      const data = resp?.data as FarScoreData | undefined
      return data || null
    },
    { expiryInSeconds: 60 * 60 * 24 }
  )
}

async function fetchEarnings(castUrl: string, type: CastType, force: boolean) {
  return await cacheGet(
    `earnings/${castUrl}`,
    async () => {
      const resp = await sendToBackground({
        name: "fetch-earnings",
        body: { castUrl, type }
      })
      const data = resp?.data as EarningsData | undefined
      return data || null
    },
    { expiryInSeconds: 60, force }
  )
}

function FarScoreIcon() {
  return (
    <svg
      className="h-[11px] w-auto fill-moxie-500 leading-[11px]"
      viewBox="0 0 16 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.841995 0H15.141V5.84H7.942V8.312H15.042V13.852H7.942V22.264H0.832001V0.0090003L0.841995 0Z"
        fill="#6A2DE0"
      />
    </svg>
  )
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

function NA() {
  return <small style={{ opacity: 0.75 }}>N/A</small>
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={`size-3 ${spin ? "animate-spin" : ""}`}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}

function FarScoreIndicator({ handle }: { handle?: string }) {
  const [data, setData] = useState<FarScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!handle) {
      return
    }
    setLoading(true)
    fetchFarStats(handle)
      .then((res) => setData(res))
      .finally(() => setLoading(false))
  }, [handle, setData, setLoading])

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <div className="flex items-baseline gap-1 h-[22px] leading-[23px]">
          <FarScoreIcon />
          <div className="text-muted flex items-baseline gap-1">
            {data?.farScore != null ? (
              <DecimalNumber value={data.farScore} />
            ) : (
              <NA />
            )}
            {loading && data?.farScore != null && <RefreshIcon spin />}
          </div>
        </div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={`HoverCardContent`} style={{ zIndex: 1 }}>
          <div className="min-h-0 grow overflow-hidden rounded-lg px-6 py-4 shadow-md bg-app">
            <div className="flex flex-row gap-6">
              <div>
                <span className="text-muted text-xs">Far Score</span>
                <div className="text-default font-bold">
                  {data?.farScore != null ? (
                    <DecimalNumber value={data.farScore} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted text-xs">Far Rank</span>
                <div className="text-default font-bold">
                  {data?.farRank != null ? (
                    data.farRank.toLocaleString("en")
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

function EarningsIndicator({
  castUrl,
  type
}: {
  castUrl: string
  type: CastType
}) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  const handleRefresh = useCallback(
    (force: boolean) => {
      if (!castUrl) {
        return
      }
      setLoading(true)
      fetchEarnings(castUrl, type, force)
        .then((res) => setData(res))
        .finally(() => setLoading(false))
    },
    [castUrl, type, setLoading, setData]
  )

  useEffect(() => handleRefresh(false), [handleRefresh])

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <div
          className={`rounded-full px-2 bg-moxie-500/10 dark:bg-moxie-500/30 flex items-baseline gap-1 h-[22px] leading-[23px]`}>
          <MoxieSimpleIcon />
          <div className="text-moxie-500 dark:text-white/60 flex items-baseline gap-1">
            {data?.earnings.total != null ? (
              <DecimalNumber value={data?.earnings.total} compact />
            ) : (
              <NA />
            )}
            {loading && data?.earnings.total != null && <RefreshIcon spin />}
          </div>
        </div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={`HoverCardContent`} style={{ zIndex: 1 }}>
          <div className="min-h-0 grow overflow-hidden rounded-lg px-6 py-4 shadow-md bg-app">
            <div className="flex flex-col gap-1">
              <div className="py-3">
                <MoxieLogo />
              </div>
              <div>
                <span className="text-muted text-xs">Creator</span>
                <div className="text-default font-bold">
                  {data?.earnings.creator != null ? (
                    <DecimalNumber value={data?.earnings.creator} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted text-xs">Creator fans</span>
                <div className="text-default font-bold">
                  {data?.earnings.creatorFans != null ? (
                    <DecimalNumber value={data?.earnings.creatorFans} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              {data?.channel != null && (
                <div>
                  <span className="text-muted text-xs">Channel fans</span>
                  <div className="text-default font-bold">
                    {data?.earnings.channelFans != null ? (
                      <DecimalNumber value={data?.earnings.channelFans} />
                    ) : (
                      <NA />
                    )}
                  </div>
                </div>
              )}
              <div>
                <span className="text-muted text-xs">Network fans</span>
                <div className="text-default font-bold">
                  {data?.earnings.network != null ? (
                    <DecimalNumber value={data?.earnings.network} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              <div className="pt-3 w-full">
                <button
                  onClick={() => !loading && handleRefresh(true)}
                  className="rounded-lg font-semibold border bg-action-tertiary border-action-tertiary hover:bg-action-tertiary-hover hover:border-action-tertiary-hover active:border-action-tertiary-active disabled:border-action-tertiary disabled:text-action-tertiary-disabled disabled:hover:bg-action-tertiary disabled:active:border-action-tertiary px-4 py-2 text-sm subtle-hover-z min-w-[92px] h-min shrink-0 grow-0 w-full"
                  disabled={loading}>
                  <div className="flex items-center gap-2 justify-center">
                    <div style={{ width: 12, height: 12 }}>
                      <RefreshIcon spin={loading} />
                    </div>
                    <span>Refresh</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

function extractCastType(elem: Element): CastType {
  const { pathname } = window.location
  const isCastContext =
    /^\/[^\/]+\/[^\/]+/.test(pathname) &&
    !pathname.startsWith("/~/") &&
    pathname.search("/quotes") === -1
  const isCurrent = isCastContext && elem.matches(selectors[0])

  // 1) we're in the cast context and the cast has a previous sibling
  // 2) contains "replying to" container
  // 3) does not have the border-faint class and has a previous sibling
  const rootCastElem = isCurrent
    ? elem.parentElement?.parentElement?.parentElement?.parentElement
        ?.parentElement?.parentElement?.parentElement
    : elem.parentElement.parentElement?.parentElement?.parentElement
        ?.parentElement?.parentElement?.parentElement?.parentElement

  const hasPrevSibling = rootCastElem?.previousElementSibling != null
  let isReply: boolean
  if (isCastContext) {
    isReply = hasPrevSibling
  } else {
    const isNotifReply = !!rootCastElem?.querySelector(
      "div.flex.flex-row.space-x-1.pb-1.text-xs.text-muted"
    )
    const elemContainer =
      elem.parentElement?.parentElement?.parentElement?.parentElement
    const isCastReply =
      elemContainer.matches(".relative.cursor-pointer.px-4.py-2") &&
      !elemContainer.matches(".border-faint") &&
      hasPrevSibling
    isReply = isNotifReply || isCastReply
  }

  return isReply ? "reply" : "cast"
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

  const profileAnchorElems =
    anchor.element.parentElement?.querySelectorAll("span > a")
  const el = profileAnchorElems[0]
  const profileLink = el?.getAttribute("href")
  const username = profileLink?.split("/").pop()

  const linkElem =
    anchor.element.tagName.toLowerCase() === "a" ? anchor.element : null
  const castUrl = linkElem
    ? (linkElem as HTMLAnchorElement).href
    : window.location.href

  const castType = extractCastType(anchor.element)

  const theme = determineTheme(window)

  const parentStyle = anchor.element.parentElement?.style
  parentStyle?.setProperty("flex-wrap", "wrap")
  parentStyle?.setProperty("row-gap", "0")

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      <div
        className={`flex items-baseline ${theme} gap-1`}
        style={{ fontFamily: "Inter" }}>
        <FarScoreIndicator handle={username} />
        <div className="text-muted">·</div>
        <EarningsIndicator castUrl={castUrl} type={castType} />
        <div className="text-muted">·</div>
      </div>
    </InlineCSUIContainer>
  )
}
