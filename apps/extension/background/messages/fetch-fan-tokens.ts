import type { PlasmoMessaging } from "@plasmohq/messaging"

import * as storage from "~utils/storage"

import type { PlasmoMessageResponse } from "./fetch-far-score"

async function fetchFanTokens(
  fid: number
): Promise<PlasmoMessageResponse<FanTokenData>> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const resp = await fetch(`${apiBaseUrl}/api/v1/users/${fid}/fan-tokens`, {
    headers: { "x-me-api-key": apiKey }
  })
  if (!resp.ok) {
    throw new Error(`Failed to fetch fan tokens data!`)
  }
  const fanTokensData = await resp.json()

  return fanTokensData as PlasmoMessageResponse<FanTokenData>
}

interface SubjectToken {
  balance: string
  id: string
}

interface UserFanToken extends SubjectToken {
  fid: number
  username: string
  type: "USER"
}

interface ChannelFanToken extends SubjectToken {
  name: string
  type: "CHANNEL"
}

interface NetworkFanToken extends SubjectToken {
  type: "NETWORK"
}

type FanToken = UserFanToken | ChannelFanToken | NetworkFanToken

export interface FanTokenData {
  fanTokens: FanToken[]
  fans: UserFanToken[]
}

interface CachedFanTokens {
  data: FanTokenData
  timestamp: number
}

let fetchPromise: Promise<FanTokenData> | null = null
let fetchTimeout: NodeJS.Timeout | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { fid } = req.body

    const fanTokensKey = `fan-tokens-${fid}`
    const cachedFanTokens = await storage.get<CachedFanTokens>(fanTokensKey)
    // refresh every hour
    if (
      cachedFanTokens &&
      Date.now() - cachedFanTokens.timestamp < 1000 * 60 * 60
    ) {
      return res.send({ data: cachedFanTokens.data })
    }
    if (!fetchPromise) {
      fetchPromise = new Promise<FanTokenData>(async (resolve) => {
        if (fetchTimeout) {
          clearTimeout(fetchTimeout)
        }

        fetchTimeout = setTimeout(async () => {
          const { data } = await fetchFanTokens(fid)
          if (data) {
            storage.set(fanTokensKey, { data, timestamp: Date.now() })
          }
          resolve(data)
          fetchPromise = null
          fetchTimeout = null
        }, 50) // Adjust this delay as needed
      })
    }
    const data = await fetchPromise
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
