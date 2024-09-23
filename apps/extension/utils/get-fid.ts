import { sendToBackground } from "@plasmohq/messaging"

import type { FidData } from "~background/messages/fetch-fid-from-handle"
import * as storage from "~utils/storage"

async function fetchFid(handle: string) {
  try {
    const resp = await sendToBackground({
      name: "fetch-fid-from-handle",
      body: { handle }
    })
    return resp as { data?: FidData }
  } catch (e) {
    console.error("ERROR", e)
    return null
  }
}

export async function getFid(window?: Window): Promise<number | null> {
  const doc = window?.document
  if (!doc) {
    return null
  }
  const profileButton = doc.querySelector(
    "#root > div > div > div > aside > div > div > a[title='Profile']"
  )
  if (!profileButton) {
    return null
  }
  const href = profileButton.getAttribute("href")
  if (!href) {
    return null
  }
  const match = href.match(/\/([^/]+)$/)
  const handle = match && match[1]
  if (!handle) {
    const lastFid = await storage.get<number>("lastFid")
    return lastFid || null
  }
  const fidByHandle = await storage.get<number>(`fid-${handle}`)
  if (fidByHandle) {
    return fidByHandle
  }
  const resp = await fetchFid(handle)
  const fid = resp.data?.fid
  if (fid) {
    storage.set(`fid-${handle}`, fid)
    storage.set("lastFid", fid)
  }
  return fid || null
}
