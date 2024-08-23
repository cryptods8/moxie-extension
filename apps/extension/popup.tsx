import { MoxieLogo } from "~ui/moxie-logo"

import "./style.css"

function IndexPopup() {
  return (
    <div>
      <div className="px-9 py-12 text-base min-w-96 bg-white text-slate-900/90 dark:bg-slate-900 flex flex-col gap-3 items-center">
        <MoxieLogo />
        <div className="text-center">
          Moxie Extension by{" "}
          <a
            href="https://warpcast.com/ds8"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline text-moxie-500 hover:opacity-70">
            ds8
          </a>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
