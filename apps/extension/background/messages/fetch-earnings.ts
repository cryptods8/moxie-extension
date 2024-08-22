import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { PlasmoMessageResponse } from "./fetch-far-score"

export type CastType = "cast" | "reply"

async function fetchEarnings(
  castUrl: string,
  type: CastType
): Promise<PlasmoMessageResponse<EarningsData>> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const params = new URLSearchParams()
  params.set("castUrl", castUrl)
  params.set("type", type)
  const resp = await fetch(
    `${apiBaseUrl}/api/v1/earnings?${params.toString()}`,
    {
      headers: { "x-me-api-key": apiKey }
    }
  )
  if (!resp.ok) {
    console.error(resp)
    throw new Error(`Failed to fetch cast earnings!`)
  }
  const fidData = await resp.json()

  return fidData as PlasmoMessageResponse<EarningsData>
}

export interface EarningsData {
  creator: {
    fid: number
    username?: string
    profileImage?: string
  }
  channel?: {
    name: string
    imageUrl: string
  }
  earnings: {
    channelFans: number
    creatorFans: number
    creator: number
    network: number
    total: number
  }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { castUrl, type } = req.body
    const { data } = await fetchEarnings(castUrl, type)
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
