import { Fragment, useEffect, useMemo, useState } from 'react'
import styles from './styles.module.css'
import { DEALS } from './data'
import useMediaQuery from './useMediaQuery.js'

function MobileExpandRow({ isOpen, colSpan, children }) {
  if (!isOpen) return null
  return (
    <tr className={styles.mobileTableExpandRow}>
      <td colSpan={colSpan} className={styles.mobileTableExpandCell}>
        {children}
      </td>
    </tr>
  )
}

// Domain → publisher label. Anything not listed falls back to the bare hostname.
const PUBLISHER = {
  'reuters.com': 'Reuters', 'cnbc.com': 'CNBC', 'bloomberg.com': 'Bloomberg', 'ft.com': 'FT', 'wsj.com': 'WSJ',
  'nytimes.com': 'NYT', 'techcrunch.com': 'TechCrunch', 'tomshardware.com': "Tom's Hardware",
  'theinformation.com': 'The Information', 'siliconangle.com': 'SiliconANGLE',
  'datacenterdynamics.com': 'DataCenterDynamics', 'investor.nvidia.com': 'NVIDIA IR',
  'nvidianews.nvidia.com': 'NVIDIA Newsroom', 'investor.lumentum.com': 'Lumentum IR',
  'coherent.com': 'Coherent', 'intc.com': 'Intel IR', 'newsroom.intel.com': 'Intel Newsroom',
  'investors.micron.com': 'Micron IR', 'amd.com': 'AMD', 'ir.amd.com': 'AMD IR',
  'apple.com': 'Apple', 'about.fb.com': 'Meta', 'oracle.com': 'Oracle', 'microsoft.com': 'Microsoft',
  'blogs.microsoft.com': 'Microsoft Blog', 'openai.com': 'OpenAI', 'anthropic.com': 'Anthropic',
  'x.ai': 'xAI', 'lambda.ai': 'Lambda', 'crusoe.ai': 'Crusoe', 'd-matrix.ai': 'd-Matrix',
  'ayarlabs.com': 'Ayar Labs', 'nscale.com': 'Nscale', 'nebius.com': 'Nebius',
  'investors.iren.com': 'IREN IR', 'investors.galaxy.com': 'Galaxy IR',
  'investors.corescientific.com': 'Core Scientific IR', 'ir.applieddigital.com': 'Applied Digital IR',
  'ir.amkor.com': 'Amkor IR', 'investors.credosemi.com': 'Credo IR', 'sec.gov': 'SEC',
  'supermicro.com': 'Super Micro', 'investor.vistracorp.com': 'Vistra IR',
  'world-nuclear-news.org': 'World Nuclear News', 'x-energy.com': 'X-Energy',
  'bam.brookfield.com': 'Brookfield', 'entergy.com': 'Entergy', 'businesswire.com': 'BusinessWire',
  'azcentral.com': 'AZ Central', 'powermag.com': 'Power Magazine', 'blog.google': 'Google Blog',
  'constellationenergy.com': 'Constellation', 'cerebras.ai': 'Cerebras', 'prnewswire.com': 'PR Newswire',
  'medianama.com': 'Medianama', 'markets.financialcontent.com': 'Market Minute',
  'europeanbusinessmagazine.com': 'European Business Magazine', 'unusualwhales.com': 'Unusual Whales',
  'channelinsider.com': 'Channel Insider', 'deeplearning.ai': 'DeepLearning.AI',
  'group.softbank': 'SoftBank', 'techpowerup.com': 'TechPowerUp', 'news.samsung.com': 'Samsung Newsroom',
  'groq.com': 'Groq', 'investor.equinix.com': 'Equinix IR', 'blogs.arista.com': 'Arista Blog',
  'dell.com': 'Dell', 'latimes.com': 'Los Angeles Times', 'siliconrepublic.com': 'Silicon Republic',
  'jonpeddie.com': 'Jon Peddie Research', 'gilderreport.com': 'Gilder Report',
  'futurumgroup.com': 'Futurum Group', 'augment.market': 'Augment Market',
  'thenextweb.com': 'The Next Web', 'forbes.com': 'Forbes', 'fastcompany.com': 'Fast Company',
  'oplexa.com': 'Oplexa', 'tech-insider.org': 'Tech Insider',
  'androidheadlines.com': 'Android Headlines', 'quiverquant.com': 'Quiver Quantitative',
  'en.wikipedia.org': 'Wikipedia', 'dig.watch': 'Digital Watch Observatory',
  'geekwire.com': 'GeekWire', 'techfundingnews.com': 'TechFundingNews',
  'siebert.com': 'Siebert', 'saturncloud.io': 'Saturn Cloud',
  'marketscreener.com': 'MarketScreener / Reuters', 'streetinsider.com': 'StreetInsider',
  'coreweave.com': 'CoreWeave', 'lambda.ai': 'Lambda',
}

const TYPE_LABEL = {
  gpu_purchase: 'GPU supply',
  custom_asic: 'custom silicon',
  equity_investment: 'equity',
  cloud_capacity: 'cloud capacity',
  m_and_a: 'M&A',
  funding_round: 'funding round',
  power_ppa: 'power PPA',
  equipment_supply: 'equipment supply',
}

function publisher(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (PUBLISHER[host]) return PUBLISHER[host]
    const dom = host.split('.').slice(-2).join('.')
    return PUBLISHER[dom] || host
  } catch {
    return 'Web'
  }
}

function articleTitle(d) {
  // Use the first sentence of the description, but don't break on decimals (e.g. "$6.3B").
  let t = String(d.description || '').replace(/\s+/g, ' ').trim()
  const m = t.match(/^(.{1,160}?[.!?])(?!\d)/)
  if (m) t = m[1].replace(/[.!?]$/, '')
  if (t.length > 160) t = t.slice(0, 157) + '…'
  return t
}

function dealLabel(d) {
  const t = TYPE_LABEL[d.deal_type] || d.deal_type
  return `${d.source}\u2013${d.target} ${t}`
}

// Background reports / aggregator pieces that aren't tied to a single deal source_url.
// Kept as a small manual list; everything else is auto-derived from DEALS.
const EXTRAS = [
  { source: 'SemiAnalysis',         article: 'Foundry Industry Q4 2025',                                              date: '2026',    deals: 'NVIDIA–Google GPU supply',     url: null },
  { source: 'AMD',                  article: 'Q3 2025 Earnings Release',                                              date: '2025-11', deals: 'AMD–Meta inference',           url: null },
  { source: 'Forbes',               article: "Inside the Neocloud Economy: What's Next for GPU-as-a-Service",         date: '2025-11', deals: 'CoreWeave–Microsoft',          url: null },
  { source: 'Silicon Analysts',     article: 'AI Data Center Value Chain Analysis 2025',                              date: '2025',    deals: 'Background / market data',     url: null },
  { source: 'Converge Digest',      article: 'NeoClouds: New Powerhouses of AI Infrastructure',                       date: '2025',    deals: 'Background / market data',     url: null },
  { source: 'CNBC',                 article: 'The year AI tech giants, and billions in debt, began remaking America', date: '2025-12', deals: 'Background / market data',     url: null },
  { source: 'Oplexa',               article: 'Broadcom Google TPU Deal 2026: The $46B AI Contract',                   date: '2026',    deals: 'Broadcom–Google revenue',      url: null },
  { source: 'Tech Insider',         article: 'Broadcom AI Revenue Surges 106%',                                       date: '2026',    deals: 'Broadcom revenue',             url: null },
  { source: 'Jon Peddie Research',  article: "Broadcom's $100B custom silicon bet",                                   date: '2026',    deals: 'Broadcom–Meta, ByteDance, Anthropic', url: 'https://www.jonpeddie.com/news/broadcoms-100b-custom-silicon-bet/' },
  { source: 'Gilder Report',        article: 'Broadcom and the Rise of Custom AI Silicon',                            date: '2025',    deals: 'Broadcom–OpenAI, Marvell–AWS', url: 'https://www.gilderreport.com/broadcom-and-the-rise-of-custom-ai-silicon/' },
  { source: 'Augment Market',       article: 'CoreWeave has now signed the four biggest AI labs',                     date: '2026-04', deals: 'CoreWeave coverage',           url: 'https://augment.market/pulse/coreweave-has-now-signed-the-four-biggest-ai-labs' },
  { source: 'TechCrunch',           article: 'The billion-dollar infrastructure deals powering the AI boom',          date: '2026-02', deals: 'AI infrastructure overview',   url: 'https://techcrunch.com/2026/02/28/billion-dollar-infrastructure-deals-ai-boom-data-centers-openai-oracle-nvidia-microsoft-google-meta/' },
  { source: 'Saturn Cloud',         article: 'GPU Cloud Comparison Report',                                           date: '2026',    deals: 'NVIDIA–Lambda leaseback',      url: 'https://saturncloud.io/reports/gpu-cloud-comparison-report/' },
  { source: 'Siebert / Bloomberg',  article: "NVIDIA's $57 Billion Flex and the Death of the AI Bubble Call",         date: '2025',    deals: 'NVIDIA hyperscaler supply',    url: 'https://blog.siebert.com/nvidias-57-billion-flex-and-the-death-of-the-ai-bubble-call' },
]

function deriveRows(deals) {
  const seen = new Set()
  const rows = []
  for (const d of deals) {
    if (!d.source_url) continue
    if (seen.has(d.source_url)) continue
    seen.add(d.source_url)
    rows.push({
      source: publisher(d.source_url),
      article: articleTitle(d),
      date: d.date,
      deals: dealLabel(d),
      url: d.source_url,
    })
  }
  return rows
}

const COLUMNS = [
  { id: 'source',  label: 'Source',           width: '160px', nowrap: true    },
  { id: 'article', label: 'Article / Report', width: 'auto'                   },
  { id: 'date',    label: 'Date',             width: '90px',  nowrap: true    },
  { id: 'deals',   label: 'Deals Referenced', width: '240px'                  },
  { id: 'link',    label: 'Link',             width: '40px',  align: 'center' },
]

const MOBILE_COLUMNS = [
  { id: 'source',  label: 'Source',  nowrap: true },
  { id: 'article', label: 'Article'               },
  { id: 'date',    label: 'Date',    nowrap: true, align: 'right' },
]

export default function SourcesSection() {
  const [sort, setSort] = useState({ column: 'date', direction: 'desc' })
  const [visibleCount, setVisibleCount] = useState(20)
  const [expandedId, setExpandedId] = useState(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const toggleExpanded = (id) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const ROWS = useMemo(
    () => [...deriveRows(DEALS), ...EXTRAS].map((r, i) => ({ ...r, n: i + 1 })),
    []
  )

  const sorted = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...ROWS].sort((a, b) => {
      const av = a[sort.column]
      const bv = b[sort.column]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [ROWS, sort])

  const visible = sorted.slice(0, visibleCount)

  const toggleSort = (col) => {
    if (sort.column === col) {
      setSort({ column: col, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ column: col, direction: col === 'n' ? 'asc' : 'asc' })
    }
  }

  return (
    <div className={styles.sourcesSection}>
      <h3 className={styles.sourcesHeading}>
        Data Sources <span className={styles.sectionSubheaderHint}>tap a row to expand</span>
      </h3>
      <div className={styles.tableWrap}>
        {!isMobile && (
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map(c => (
                  <th
                    key={c.id}
                    onClick={() => toggleSort(c.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSort(c.id) }}
                    data-align={c.align}
                    tabIndex={0}
                    scope="col"
                    aria-sort={sort.column === c.id ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    style={{
                      ...(c.width ? { width: c.width } : {}),
                      ...(c.nowrap ? { whiteSpace: 'nowrap' } : {}),
                    }}
                  >
                    {c.label}
                    {sort.column === c.id && (
                      <span className={styles.sortIndicator}>
                        {sort.direction === 'asc' ? ' \u2191' : ' \u2193'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const expanded = expandedId === r.n
                const truncClass = expanded ? styles.descTextExpanded : styles.descTextTruncated
                return (
                  <tr
                    key={r.n}
                    className={`${styles.clickableRow} ${styles.rowEnter}`}
                    onClick={() => toggleExpanded(r.n)}
                  >
                    <td className={styles.sourcesCategoryCell}>{r.source}</td>
                    <td className={styles.descCell}>
                      <div className={truncClass}>
                        {r.url ? (
                          <a className={styles.sourcesLink} href={r.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{r.article}</a>
                        ) : r.article}
                      </div>
                    </td>
                    <td>{r.date}</td>
                    <td>
                      <div className={truncClass}>{r.deals}</div>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {r.url ? (
                        <a className={styles.sourceLink} href={r.url} target="_blank" rel="noreferrer">↗</a>
                      ) : <span className={styles.fundingDash}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {isMobile && (
          <>
            <table className={styles.mobileTable}>
              <thead>
                <tr>
                  {MOBILE_COLUMNS.map(c => (
                    <th
                      key={c.id}
                      onClick={() => toggleSort(c.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSort(c.id) }}
                      data-align={c.align}
                      tabIndex={0}
                      scope="col"
                      aria-sort={sort.column === c.id ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      style={{ ...(c.nowrap ? { whiteSpace: 'nowrap' } : {}) }}
                    >
                      {c.label}
                      {sort.column === c.id && (
                        <span className={styles.sortIndicator}>
                          {sort.direction === 'asc' ? ' \u2191' : ' \u2193'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(r => {
                  const expanded = expandedId === r.n
                  return (
                    <Fragment key={r.n}>
                      <tr
                        className={styles.clickableRow}
                        onClick={() => toggleExpanded(r.n)}
                      >
                        <td>{r.source}</td>
                        <td>{r.article}</td>
                        <td className={styles.valueCell}>{r.date}</td>
                      </tr>
                      <MobileExpandRow isOpen={expanded} colSpan={MOBILE_COLUMNS.length}>
                        <div className={styles.mobileTableExpandMeta}>
                          <span>{r.deals}</span>
                          {r.url && (
                            <a
                              className={styles.sourceLink}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                            >↗</a>
                          )}
                        </div>
                      </MobileExpandRow>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
        {sorted.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 0,
            fontSize: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '6px 12px',
            }}>
              {sorted.length > visibleCount && (() => {
                const remaining = sorted.length - visibleCount
                const nextChunk = Math.min(20, remaining)
                const isInitial = visibleCount === 20
                return (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setVisibleCount(prev => prev + nextChunk)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setVisibleCount(prev => prev + nextChunk) }}
                    style={{ cursor: 'pointer', fontWeight: 400, color: 'var(--text)' }}
                  >
                    {isInitial ? `Show next ${nextChunk}` : 'Next'}
                  </span>
                )
              })()}
              {visibleCount > 20 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setVisibleCount(prev => Math.max(20, prev - 20))}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setVisibleCount(prev => Math.max(20, prev - 20)) }}
                  style={{ cursor: 'pointer', fontWeight: 400, color: 'var(--text)' }}
                >
                  Back
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>
                Showing {Math.min(visibleCount, sorted.length) === sorted.length
                  ? `all ${sorted.length}`
                  : `1-${Math.min(visibleCount, sorted.length)} of ${sorted.length}`
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
