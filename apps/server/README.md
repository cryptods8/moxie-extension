# $DEGEN Tips server

This is a [Next.js](https://nextjs.org/)-based server used by the [extension](/apps/extension/README.md) for $DEGEN tips validation

## Demo

DEMO instance is currently running on vercel at [moxie-server.vercel.app](https://moxie-server.vercel.app)

## Getting Started

First, create your own `.env` file in the `apps/server` directory (you can use the `.env.sample` file included for inspiration), you must set the following environment variables:

- `API_KEY` - API key used by the extension (it's effectively public - can be found in the extension build)
- `NEYNAR_API_KEY` - Neynar API key used for cast data retrieval
- `REDIS_API_URL` - Upstash Redis instance API URL - optional (for caching)
- `REDIS_API_TOKEN` - Upstash Redis instance API Token - optional (for caching)

Then you can run the server from the monorepo root directory:

```
pnpm dev --filter=server
```
