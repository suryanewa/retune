# Playground (retune-site)

The [Retune marketing site](https://github.com/khadgi-sujan/retune-site) lives here as the monorepo playground. It imports the local `packages/overlay` package instead of the published `retune` npm package.

## Development

From the repo root:

```bash
npm install
npm run build -w retune
npm run dev
```

Open http://localhost:3001. The overlay rebuilds in watch mode; Next.js hot-reloads the site.

To run only the playground:

```bash
npm run dev -w playground
```
