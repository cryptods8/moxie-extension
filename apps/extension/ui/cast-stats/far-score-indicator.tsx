import * as HoverCard from "@radix-ui/react-hover-card"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type { FarScoreData } from "~background/messages/fetch-far-score"
import type { UserEarningsData } from "~background/messages/fetch-user-earnings"
import { DecimalNumber } from "~ui/decimal-number"
import { FarScoreIcon } from "~ui/icons/far-score-icon"
import { RefreshIcon } from "~ui/icons/refresh-icon"
import { MoxieEarnings } from "~ui/moxie-earnings"
import { NA } from "~ui/na"
import { ShadowRoot } from "~ui/shadow-root"
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

async function fetchUserEarnings(handle: string, force: boolean = false) {
  return await cachedGet(
    `userEarnings/${handle}`,
    async () => {
      const resp = await sendToBackground({
        name: "fetch-user-earnings",
        body: { handle }
      })
      const data = resp?.data as UserEarningsData | undefined
      return data || null
    },
    { expiryInSeconds: 60 * 5, force }
  )
}

export function FarScoreIndicator({
  handle,
  client
}: {
  handle?: string
  client?: "supercast"
}) {
  const [data, setData] = useState<{
    stats: FarScoreData
    earnings: UserEarningsData
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!handle) {
      return
    }
    setLoading(true)
    Promise.all([fetchFarStats(handle), fetchUserEarnings(handle)])
      .then(([stats, earnings]) => {
        setData({ stats, earnings })
      })
      .finally(() => setLoading(false))
  }, [handle, setData, setLoading])

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <div className="flex items-baseline gap-1 h-[22px] leading-[23px]">
          <FarScoreIcon />
          <div className="text-muted flex items-baseline gap-1">
            {data?.stats?.farScore != null ? (
              <DecimalNumber value={data.stats.farScore} />
            ) : (
              <NA />
            )}
            {loading && data?.stats?.farScore != null && <RefreshIcon spin />}
          </div>
        </div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={`HoverCardContent`} style={{ zIndex: 1 }}>
          <ShadowRoot>
            <div
              className={`min-h-0 min-w-64 grow overflow-hidden rounded-lg px-4 shadow-md bg-white dark:bg-default-dark`}
              style={{ fontFamily: "Inter, sans-serif" }}>
              <div className="flex flex-row gap-4 px-2 py-4">
                <div>
                  <span className="text-muted text-xs">Far Score</span>
                  <div className="text-default font-bold">
                    {data?.stats?.farScore != null ? (
                      <DecimalNumber value={data.stats.farScore} />
                    ) : (
                      <NA />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted text-xs">Far Rank</span>
                  <div className="text-default font-bold">
                    {data?.stats?.farRank != null ? (
                      data.stats.farRank.toLocaleString("en")
                    ) : (
                      <NA />
                    )}
                  </div>
                </div>
              </div>
              <div className="px-2 py-4 border-t border-faint">
                <div className="text-muted text-xs mb-2">Moxie earnings</div>
                <div className="py-1 flex flex-col gap-2">
                  <MoxieEarnings
                    earnings={data?.earnings?.today}
                    title="Today"
                  />
                  <MoxieEarnings
                    earnings={data?.earnings?.weekly}
                    title="Last 7 days"
                  />
                  <MoxieEarnings
                    earnings={data?.earnings?.lifetime}
                    title="All time"
                  />
                </div>
              </div>
            </div>
          </ShadowRoot>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
