import type { PlasmoMessaging } from "@plasmohq/messaging"

async function fetchFarScore(
  handle: string
): Promise<PlasmoMessageResponse<FarScoreData>> {
  const apiBaseUrl =
    process.env.PLASMO_PUBLIC_PROXY_URL || "http://localhost:3000"
  const apiKey = process.env.PLASMO_PUBLIC_PROXY_KEY
  if (!apiKey) {
    throw new Error("PLASMO_PUBLIC_PROXY_KEY not set")
  }
  const params = new URLSearchParams()
  params.set("handle", handle)
  const resp = await fetch(
    `${apiBaseUrl}/api/v1/far-scores?${params.toString()}`,
    {
      headers: { "x-me-api-key": apiKey }
    }
  )
  if (!resp.ok) {
    throw new Error(`Failed to fetch far score data!`)
  }
  const fidData = await resp.json()

  return fidData as PlasmoMessageResponse<FarScoreData>
}

export interface FarScoreData {
  farScore: number | null
  farRank: number | null
}

export interface PlasmoMessageResponse<T> {
  data: T
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { handle } = req.body
    const { data } = await fetchFarScore(handle)
    return res.send({ data })
  } catch (e) {
    console.error(e)
    return res.send({ error: (e as any).message })
  }
}

export default handler
