import cssText from "data-text:~style.css"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { createRoot } from "react-dom/client"

import type { CastType } from "~background/messages/fetch-earnings"
import { EarningsIndicator } from "~ui/cast-stats/earnings-indicator"
import { FarScoreIndicator } from "~ui/cast-stats/far-score-indicator"
import { determineTheme } from "~utils/determine-theme"

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
  '#root > div > div > div > main > div > div > div.fade-in > div > div > div > div.relative.flex.flex-col > div > div > div.flex.flex-row.justify-between.gap-2 > div:not([role="menuitem"]) > div > a:not(.cursor-pointer)',
  // '#root > div > div > div > main > div > div > div.fade-in > div > div > div > div.relative.flex.flex-col > div > div > div.flex.flex-row.justify-between.gap-2 > div > div > a:nth-child(4)'
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element,
    insertPosition: "beforebegin"
  }))
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

  const hasMiddot =
    anchor.element.previousElementSibling?.previousElementSibling?.matches(
      "div.text-muted.text-base"
    )

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      <div className={`flex ${theme} gap-1`} style={{ fontFamily: "Inter" }}>
        {!hasMiddot && <div className="text-muted">·</div>}
        <FarScoreIndicator handle={username} />
        <div className="text-muted">·</div>
        <EarningsIndicator castId={{ url: castUrl, type: castType }} />
        <div className="text-muted">·</div>
      </div>
    </InlineCSUIContainer>
  )
}
