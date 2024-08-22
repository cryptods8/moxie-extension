export default async function Home() {
  return (
    <div>
      <div className="px-9 py-12 text-base min-w-96 text-center bg-slate-900 text-sky-100 w-full h-dvh flex items-center justify-center">
        <p>
          Moxie Extension Server by{" "}
          <a
            href="https://warpcast.com/ds8"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-sky-400 hover:underline hover:text-sky-500"
          >
            ds8
          </a>
        </p>
      </div>
    </div>
  );
}
