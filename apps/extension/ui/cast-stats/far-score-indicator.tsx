import * as HoverCard from "@radix-ui/react-hover-card"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type { FarScoreData } from "~background/messages/fetch-far-score"
import { DecimalNumber } from "~ui/decimal-number"
import { FarScoreIcon } from "~ui/icons/far-score-icon"
import { RefreshIcon } from "~ui/icons/refresh-icon"
import { NA } from "~ui/na"
import { cachedGet } from "~utils/cached-get"

async function fetchFarStats(handle: string) {
  return await cachedGet(
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

export function FarScoreIndicator({
  handle,
  client
}: {
  handle?: string
  client?: "supercast"
}) {
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
          <div
            className={`min-h-0 grow overflow-hidden rounded-lg px-6 py-4 shadow-md ${client === "supercast" ? "bg-white dark:bg-gray-900" : "bg-app"}`}>
            <div className="flex flex-row gap-4 gap-x-4">
              <div>
                <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                  Far Score
                </span>
                <div className="text-default font-bold">
                  {data?.farScore != null ? (
                    <DecimalNumber value={data.farScore} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                  Far Rank
                </span>
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
