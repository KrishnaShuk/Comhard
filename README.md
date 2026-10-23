# TaskFlow

A single-user CRM-style task workspace with SLA tracking, a board, list, sections,
and compliance insights.

## Stack

- pnpm monorepo, Node 22
- `apps/web`: Next.js App Router, TypeScript, Tailwind, Radix/shadcn-style UI,
  TanStack Query, dnd-kit, next-themes
- `apps/api`: Express, Mongoose, zod, argon2, JWT, helmet, rate limiting, pino
- `packages/shared`: zod schemas, domain types, SLA/date/transition helpers
- MongoDB 7

## Layout

```text
apps/web        Next.js UI
apps/api        Express API + serverless entry in api/[...path].ts
packages/shared shared domain code
```

## Local setup

```bash
pnpm install
cp .env.example .env
# set a JWT_SECRET of at least 32 characters
pnpm db:up
pnpm seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health
- Mongo: `localhost:27018`

If port 3000 is busy, run `PORT=3001 pnpm --filter @taskflow/web dev` and set
`WEB_ORIGIN=http://localhost:3001` in `.env`.

Demo account from the seed:

```text
demo@taskflow.dev
TaskFlowDemo123!
```

`pnpm seed` is idempotent for the demo account and refuses to run when
`NODE_ENV=production`.

## Scripts

```bash
pnpm dev        # web + api
pnpm build      # api typecheck + web production build
pnpm lint
pnpm typecheck
pnpm db:up
pnpm db:down
pnpm seed
```

## Environment

Root `.env` for local development:

```text
MONGODB_URI=mongodb://127.0.0.1:27018/taskflow
JWT_SECRET=at-least-32-characters
PORT=4000
COOKIE_SECURE=false
WEB_ORIGIN=http://localhost:3000
API_URL=http://localhost:4000
NODE_ENV=development
```

## Deployment: Vercel + MongoDB Atlas

The browser talks only to the web project. Next.js rewrites `/api/*` to the API
project, so the JWT cookie stays same-origin.

1. **Atlas:** create a cluster and database user, allow `0.0.0.0/0` for Vercel,
   and copy a `mongodb+srv://.../taskflow` URI. Seed it locally:
   `MONGODB_URI='...' NODE_ENV=development pnpm seed`.
2. **API project:** import the repo on Vercel, root directory `apps/api`,
   framework preset `Other`, build command `pnpm build`, Node 22.
   Environment: `MONGODB_URI`, `JWT_SECRET`, `COOKIE_SECURE=true`,
   `WEB_ORIGIN=https://<web-domain>`, `NODE_ENV=production`.
3. **Web project:** import the same repo, root directory `apps/web`, framework
   `Next.js`. Environment: `API_URL=https://<api-domain>` for Production and
   Preview. Redeploy after changing it.
4. Verify `https://<api-domain>/api/health`, then sign in at the web domain.

The API is exposed through `apps/api/api/[...path].ts`; it caches the Mongo
connection across serverless invocations in `src/db.ts`.
