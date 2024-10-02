import { useCallback, useState } from "react"

import type { UserEarningStat } from "~background/messages/fetch-user-earnings"

import { DecimalNumber } from "./decimal-number"

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

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-3">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  )
}

export function MoxieEarnings({
  earnings,
  title
}: {
  earnings?: UserEarningStat
  title: string
}) {
  const [expanded, setExpanded] = useState(false)

  const handleToggleExpand = useCallback(
    () => setExpanded((e) => !e),
    [setExpanded]
  )

  return (
    <div className="flex flex-col">
      <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-between">
        <div className="text-sm text-muted">{title}</div>
        <button
          className="text-base text-default flex items-baseline gap-1"
          onClick={handleToggleExpand}>
          <MoxieSimpleIcon />
          {earnings ? (
            <DecimalNumber value={earnings.allEarningsAmount} />
          ) : (
            <small style={{ opacity: 0.75 }}>N/A</small>
          )}
          <div
            className={`flex items-center justify-center ${expanded ? "rotate-180" : ""} transition-transform`}>
            <ChevronDownIcon />
          </div>
        </button>
      </div>
      {expanded && earnings && (
        <div className="w-full pl-10 pr-4">
          <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-end">
            <div className="text-xs text-muted">Casts</div>
            <div className="text-sm text-default flex items-baseline gap-1">
              <DecimalNumber value={earnings.castEarningsAmount} />
            </div>
          </div>
          <div className="flex flex-row flex-wrap gap-y-1 gap-x-3 items-baseline w-full justify-end">
            <div className="text-xs text-muted">Frames</div>
            <div className="text-sm text-default flex items-baseline gap-1">
              <DecimalNumber value={earnings.frameDevEarningsAmount} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
