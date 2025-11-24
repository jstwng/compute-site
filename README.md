# Compute Deal Map Site

Standalone site for `compute.jstwng.com`. Renders the compute deal map visualization and transaction table from the [compute-deal-map-data](https://github.com/jstwng/compute-deal-map-data) dataset.

## Development

```
npm install
npm run dev     # http://localhost:8002
npm run build
npm run preview
```

Deal data is pulled from GitHub release artifacts at build time via the `deal-data` Vite plugin (see `scripts/vite-plugin-deal-data.mjs`). Set `DEAL_DATA_VERSION=<tag>` to pin a specific release.

## Deploy

Configured for Netlify. Point the `compute.jstwng.com` DNS record to the Netlify site and Netlify will serve from `dist/`.
