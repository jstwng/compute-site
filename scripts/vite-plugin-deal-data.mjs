import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_OWNER = 'jstwng'
const DEFAULT_REPO = 'compute-deal-map-data'
const DEFAULT_OUT_DIR = path.resolve('src/components/ComputeDealMap')
const DEFAULT_CACHE_DIR = path.resolve('node_modules/.cache/deal-data')

function releaseUrl(owner, repo, version, filename) {
  if (version === 'latest') {
    return `https://github.com/${owner}/${repo}/releases/latest/download/${filename}`
  }
  return `https://github.com/${owner}/${repo}/releases/download/${version}/${filename}`
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return await res.text()
}

export default function dealDataPlugin(userOpts = {}) {
  const opts = {
    owner: userOpts.owner ?? DEFAULT_OWNER,
    repo: userOpts.repo ?? DEFAULT_REPO,
    version: userOpts.version ?? process.env.DEAL_DATA_VERSION ?? 'latest',
    outDir: userOpts.outDir ?? DEFAULT_OUT_DIR,
    cacheDir: userOpts.cacheDir ?? DEFAULT_CACHE_DIR,
  }

  return {
    name: 'deal-data',
    async buildStart() {
      fs.mkdirSync(opts.outDir, { recursive: true })
      fs.mkdirSync(opts.cacheDir, { recursive: true })

      const targets = [
        { remote: 'deals.json', cache: 'deals.json', out: 'data.generated.json' },
        { remote: 'companies.json', cache: 'companies.json', out: 'companies.generated.json' },
      ]

      for (const t of targets) {
        const url = releaseUrl(opts.owner, opts.repo, opts.version, t.remote)
        const cachePath = path.join(opts.cacheDir, t.cache)
        const outPath = path.join(opts.outDir, t.out)

        let body
        try {
          body = await fetchText(url)
          fs.writeFileSync(cachePath, body)
        } catch (err) {
          if (fs.existsSync(cachePath)) {
            this.warn?.(`[deal-data] fetch failed (${err.message}); using cache at ${cachePath}`)
            body = fs.readFileSync(cachePath, 'utf8')
          } else {
            throw new Error(`[deal-data] fetch failed and no cached data at ${cachePath}: ${err.message}`)
          }
        }
        fs.writeFileSync(outPath, body)
      }
    },
  }
}
