import * as HoverCard from "@radix-ui/react-hover-card"
import { useCallback, useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type {
  CastIdentifier,
  CastType,
  EarningsData
} from "~background/messages/fetch-earnings"
import { DecimalNumber } from "~ui/decimal-number"
import { RefreshIcon } from "~ui/icons/refresh-icon"
import { MoxieLogo } from "~ui/moxie-logo"
import { NA } from "~ui/na"
import { cachedGet } from "~utils/cached-get"

async function fetchEarnings(castId: CastIdentifier, force: boolean) {
  const key = "url" in castId ? castId.url : `byHash/${castId.hash}`
  return await cachedGet(
    `earnings/${key}`,
    async () => {
      const resp = await sendToBackground({
        name: "fetch-earnings",
        body: { castId }
      })
      const data = resp?.data as EarningsData | undefined
      return data || null
    },
    { expiryInSeconds: 60, force }
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

export function EarningsIndicator({
  castId,
  client
}: {
  castId: CastIdentifier
  client?: "supercast"
}) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  const handleRefresh = useCallback(
    (force: boolean) => {
      if (!castId) {
        return
      }
      setLoading(true)
      fetchEarnings(castId, force)
        .then((res) => setData(res))
        .finally(() => setLoading(false))
    },
    [castId, setLoading, setData]
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
          <div
            className={`min-h-0 grow overflow-hidden rounded-lg px-6 py-4 shadow-md ${client === "supercast" ? "bg-white dark:bg-gray-900" : "bg-app"}`}>
            <div className="flex flex-col gap-1">
              <div className="py-3">
                <MoxieLogo />
              </div>
              <div>
                <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                  Creator
                </span>
                <div className="text-default font-bold">
                  {data?.earnings.creator != null ? (
                    <DecimalNumber value={data?.earnings.creator} />
                  ) : (
                    <NA />
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                  Creator fans
                </span>
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
                  <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                    Channel fans
                  </span>
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
                <span className="text-muted text-xs text-gray-500 dark:text-gray-400">
                  Network fans
                </span>
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
