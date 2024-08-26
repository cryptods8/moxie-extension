import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { PlasmoMessageResponse } from "./fetch-far-score"

export interface UserEarningStat {
  allEarningsAmount: number
  castEarningsAmount: number
  frameDevEarningsAmount: number
  otherEarningsAmount: number
}

export interface UserEarningsData {
  today: UserEarningStat
  weekly: UserEarningStat
  lifetime: UserEarningStat
}

async function fetchUserEarnings(
  fid: number
): Promise<PlasmoMessageResponse<UserEarningsData>> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const resp = await fetch(`${apiBaseUrl}/api/v1/users/${fid}/earnings`, {
    headers: { "x-me-api-key": apiKey }
  })
  if (!resp.ok) {
    console.error(resp)
    throw new Error(`Failed to fetch cast earnings!`)
  }
  const userEarningsData = await resp.json()

  return userEarningsData as PlasmoMessageResponse<UserEarningsData>
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { fid } = req.body
    const { data } = await fetchUserEarnings(fid)
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
