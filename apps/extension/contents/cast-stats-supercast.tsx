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
  matches: ["https://*.supercast.xyz/*"],
  css: ["inter-font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const selectors = [
  // casts
  "main > div > div > div > ul > li > a > div > div > div > div > span:last-child",
  "main > div > div > ul > a > div > div > div > div > span:last-child",
  // "aside > div > div > div.pt-3.pb-2.px-4.w-full > div > div > div > div > span:last-child",
  // replies
  "main > div > div > div > div > div > div > div > div > span:last-child",
  "main > div > div > div > ul > span > li > a > div > div > div > div > span:last-child"
  // "aside > div > div > ul > span > li > div > div > div > div > span:last-child",
  // "aside > div > div > ul > li > div > div > div > div > span:last-child"
] as const

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const fullSelectors = selectors.join(", ")
  const anchors = document.querySelectorAll(fullSelectors)
  return Array.from(anchors).map((element) => ({
    element,
    insertPosition: "beforebegin"
  }))
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
    anchor.element.parentElement?.querySelectorAll("a > a")
  const el = profileAnchorElems[0]
  const profileLink = el?.getAttribute("href")
  const username = profileLink?.split("/").pop()

  const castWrapperElem =
    anchor.element.parentElement?.parentElement?.parentElement?.parentElement
      ?.parentElement
  console.log("castWrapperElem", castWrapperElem?.tagName)
  const linkElem =
    castWrapperElem?.tagName.toLowerCase() === "a" ? castWrapperElem : null
  const castUrl = linkElem
    ? (linkElem as HTMLAnchorElement).href
    : window.location.href
  const castHash = castUrl.split("/").pop()

  const theme = determineTheme(window)

  const parentStyle = anchor.element.parentElement?.style
  parentStyle?.setProperty("flex-wrap", "wrap")
  parentStyle?.setProperty("row-gap", "0")

  root.render(
    <InlineCSUIContainer anchor={anchor}>
      <div
        className={`flex items-baseline ${theme} gap-1 ml-1 ${linkElem ? "mt-[-1px]" : ""}`}
        style={{ fontFamily: "Inter" }}>
        <FarScoreIndicator handle={username} client={"supercast"} />
        <div className="text-muted">·</div>
        <EarningsIndicator castId={{ hash: castHash as `0x${string}` }} client={"supercast"} />
        <div className="text-muted">·</div>
      </div>
    </InlineCSUIContainer>
  )
}
