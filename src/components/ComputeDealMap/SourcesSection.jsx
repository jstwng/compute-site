import { useMemo, useState } from 'react'
import styles from './styles.module.css'

// Grounded in the 26 numbered citations from the original spec + unique
// source_url fields from the deals dataset. No fabricated entries.
const RAW_ROWS = [
  { source: 'Reuters',                   article: 'CoreWeave, Nvidia sign $6.3 billion cloud computing capacity order', date: '2025-09', deals: 'NVIDIA–CoreWeave capacity', url: 'https://www.reuters.com/business/coreweave-nvidia-sign-63-billion-cloud-computing-capacity-order-2025-09-15/' },
  { source: 'Los Angeles Times',         article: 'Nvidia invests an additional $2 billion in CoreWeave',              date: '2026-01', deals: 'NVIDIA–CoreWeave equity',   url: 'https://www.latimes.com/business/story/2026-01-26/nvidia-invests-additional-2-billion-in-coreweave' },
  { source: 'NVIDIA Investor Relations', article: 'NVIDIA and Nebius Partner to Scale Full-Stack AI Cloud',            date: '2026-03', deals: 'NVIDIA–Nebius',            url: 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-and-Nebius-Partner-to-Scale-Full-Stack-AI-Cloud/' },
  { source: 'TechCrunch',                article: 'The billion-dollar infrastructure deals powering the AI boom',      date: '2026-02', deals: 'NVIDIA–OpenAI GPU, Oracle–Stargate, AMD–OpenAI', url: 'https://techcrunch.com/2026/02/28/billion-dollar-infrastructure-deals-ai-boom-data-centers-openai-oracle-nvidia-microsoft-google-meta/' },
  { source: 'Reuters',                   article: 'From OpenAI to Nvidia, firms channel billions into AI infrastructure', date: '2026-04', deals: 'Oracle–Meta, NVIDIA–Anthropic', url: 'https://www.reuters.com/business/autos-transportation/companies-pouring-billions-advance-ai-infrastructure-2026-04-09/' },
  { source: 'Saturn Cloud',              article: 'GPU Cloud Comparison Report',                                        date: '2026',    deals: 'NVIDIA–Lambda leaseback',   url: 'https://saturncloud.io/reports/gpu-cloud-comparison-report/' },
  { source: 'Siebert / Bloomberg SPLC',  article: "NVIDIA's $57 Billion Flex and the Death of the AI Bubble Call",      date: '2025',    deals: 'NVIDIA hyperscaler supply', url: 'https://blog.siebert.com/nvidias-57-billion-flex-and-the-death-of-the-ai-bubble-call' },
  { source: 'SemiAnalysis',              article: 'Foundry Industry Q4 2025',                                           date: '2026',    deals: 'NVIDIA–Google GPU supply',  url: null },
  { source: 'AMD Press Release',         article: 'AMD and Meta Announce Expanded Strategic Partnership',               date: '2026-02', deals: 'AMD–Meta GPU + warrants',  url: 'https://www.amd.com/en/newsroom/press-releases/2026-2-24-amd-and-meta-announce-expanded-strategic-partnersh.html' },
  { source: 'Oracle Press Release',      article: 'Oracle and AMD Expand Partnership',                                  date: '2025-10', deals: 'AMD–Oracle supercluster',  url: 'https://www.oracle.com/news/announcement/ai-world-oracle-and-amd-expand-partnership-to-help-customers-achieve-next-generation-ai-scale-2025-10-14/' },
  { source: 'AMD',                       article: 'Advancing AI 2025',                                                  date: '2025-06', deals: 'AMD–Microsoft deployment',  url: 'https://ir.amd.com/news-events/press-releases/detail/1255/amd-unveils-vision-for-an-open-ai-ecosystem-detailing-new-silicon-software-and-systems-at-advancing-ai-2025' },
  { source: 'AMD',                       article: 'Q3 2025 Earnings Release',                                           date: '2025-11', deals: 'AMD–Meta inference',        url: null },
  { source: 'Reuters',                   article: "Broadcom signs long-term deal to develop Google's custom AI chips",  date: '2026-04', deals: 'Broadcom–Google TPU',      url: 'https://www.reuters.com/business/broadcom-signs-long-term-deal-develop-googles-custom-ai-chips-2026-04-06/' },
  { source: 'Silicon Republic',          article: 'Anthropic, Google, Broadcom announce 3.5GW TPU deal',                date: '2026-04', deals: 'Broadcom–Anthropic TPU',    url: 'https://www.siliconrepublic.com/machines/anthropic-google-broadcom-announce-3-5gw-tpu-deal' },
  { source: 'Jon Peddie Research',       article: "Broadcom's $100B custom silicon bet",                                date: '2026',    deals: 'Broadcom–Meta, ByteDance, Anthropic', url: 'https://www.jonpeddie.com/news/broadcoms-100b-custom-silicon-bet/' },
  { source: 'Gilder Report',             article: 'Broadcom and the Rise of Custom AI Silicon',                         date: '2025',    deals: 'Broadcom–OpenAI, Marvell–AWS, Marvell–MSFT', url: 'https://www.gilderreport.com/broadcom-and-the-rise-of-custom-ai-silicon/' },
  { source: 'Futurum Group',             article: "Anthropic's Gigawatt-Scale TPU Deal with Broadcom",                  date: '2026-04', deals: 'Broadcom–xAI, Broadcom–Apple', url: 'https://futurumgroup.com/insights/anthropics-gigawatt-scale-tpu-deal-with-broadcom-creates-a-structural-advantage/' },
  { source: 'Augment Market',            article: 'CoreWeave has now signed the four biggest AI labs',                  date: '2026-04', deals: 'CoreWeave–Meta, CoreWeave–Google', url: 'https://augment.market/pulse/coreweave-has-now-signed-the-four-biggest-ai-labs' },
  { source: 'The Next Web',              article: 'CoreWeave signs multi-year Anthropic deal',                          date: '2026-04', deals: 'CoreWeave–Anthropic',      url: 'https://thenextweb.com/news/coreweave-has-agreed-a-multi-year-gpu-cloud-deal-with-anthropic-to-power-claude-at-production-scale-its-second-major-ai-infrastructure-announcement-in-48-hours' },
  { source: 'Forbes',                    article: "Inside the Neocloud Economy: What's Next for GPU-as-a-Service",      date: '2025-11', deals: 'CoreWeave–Microsoft',      url: null },
  { source: 'Fast Company',              article: 'The most innovative computing companies of 2026',                    date: '2026',    deals: 'Nebius–Microsoft, Nebius–Meta', url: 'https://www.fastcompany.com/91497091/computing-most-innovative-companies-2026' },
  { source: 'Silicon Analysts',          article: 'AI Data Center Value Chain Analysis 2025',                           date: '2025',    deals: 'Background / market data',   url: null },
  { source: 'Converge Digest',           article: 'NeoClouds: New Powerhouses of AI Infrastructure',                    date: '2025',    deals: 'Background / market data',   url: null },
  { source: 'CNBC',                      article: 'The year AI tech giants, and billions in debt, began remaking America', date: '2025-12', deals: 'Background / market data', url: null },
  { source: 'Oplexa',                    article: 'Broadcom Google TPU Deal 2026: The $46B AI Contract',                date: '2026',    deals: 'Broadcom–Google revenue',  url: null },
  { source: 'Tech Insider',              article: 'Broadcom AI Revenue Surges 106%',                                    date: '2026',    deals: 'Broadcom revenue',          url: null },
  // Additional rows from deal source_urls not covered by the 26 numbered citations
  { source: 'AMD Investor Relations',    article: 'AMD and OpenAI announce strategic partnership to deploy 6 GW of AMD GPUs', date: '2025-10', deals: 'AMD–OpenAI GPU', url: 'https://ir.amd.com/news-events/press-releases/detail/1260/amd-and-openai-announce-strategic-partnership-to-deploy-6-gigawatts-of-amd-gpus' },
  { source: "Tom's Hardware",            article: 'OpenAI, Broadcom to co-develop 10GW of custom AI chips',             date: '2025-10', deals: 'Broadcom–OpenAI ASIC',      url: 'https://www.tomshardware.com/openai-broadcom-to-co-develop-10gw-of-custom-ai-chips' },
  { source: 'CNBC',                      article: 'Anthropic, Google Cloud sign TPU deal worth up to $50B',             date: '2025-10', deals: 'Google–Anthropic TPU',      url: 'https://www.cnbc.com/2025/10/23/anthropic-google-cloud-deal-tpu.html' },
  { source: 'TechFundingNews',           article: "Amazon's Anthropic AI investment strategy",                          date: '2025',    deals: 'Amazon–Anthropic equity',   url: 'https://techfundingnews.com/amazon-anthropic-ai-investment-strategy/' },
  { source: 'Microsoft Blog',            article: 'Microsoft, NVIDIA and Anthropic announce strategic partnerships',    date: '2025-11', deals: 'MSFT–Anthropic equity',     url: 'https://blogs.microsoft.com/blog/2025/11/18/microsoft-nvidia-and-anthropic-announce-strategic-partnerships/' },
  { source: 'GeekWire',                  article: 'Microsoft to invest $5B in Anthropic; $30B Azure commit',            date: '2025-11', deals: 'Anthropic–MSFT Azure',      url: 'https://www.geekwire.com/2025/microsoft-to-invest-5b-in-anthropic-as-claude-maker-commits-30b-to-azure-in-new-nvidia-alliance/' },
  { source: 'CNBC',                      article: 'Anthropic to use Azure, team up with Microsoft and NVIDIA',          date: '2025-11', deals: 'NVIDIA–Anthropic equity',   url: 'https://www.cnbc.com/2025/11/18/anthropic-ai-azure-microsoft-nvidia.html' },
  { source: 'OpenAI Blog',               article: 'Accelerating the next phase of AI',                                  date: '2026-03', deals: 'NVIDIA–OpenAI equity, OpenAI funding', url: 'https://openai.com/index/accelerating-the-next-phase-ai/' },
  { source: 'CNBC',                      article: 'OpenAI closes $122B funding round at $852B valuation',               date: '2026-03', deals: 'Amazon–OpenAI equity, OpenAI funding', url: 'https://www.cnbc.com/2026/03/31/openai-funding-round-ipo.html' },
  { source: 'Bloomberg',                 article: 'SoftBank, OpenAI plan $19B each for Stargate',                       date: '2025-01', deals: 'SoftBank–OpenAI equity',    url: 'https://www.bloomberg.com/news/articles/2025-01-23/softbank-openai-plan-19-billion-each-for-stargate-information' },
  { source: 'CNBC',                      article: 'Cerebras scores OpenAI deal worth over $10 billion',                 date: '2026-01', deals: 'Cerebras–OpenAI capacity',  url: 'https://www.cnbc.com/2026/01/14/cerebras-scores-openai-deal-worth-over-10-billion.html' },
  { source: 'CNBC',                      article: 'NVIDIA buying AI chip startup Groq for ~$20 billion',                date: '2025-12', deals: 'NVIDIA–Groq M&A',           url: 'https://www.cnbc.com/2025/12/24/nvidia-buying-ai-chip-startup-groq-for-about-20-billion-biggest-deal.html' },
  { source: 'CNBC',                      article: 'Samsung Electronics new chip supply contract',                       date: '2025-07', deals: 'Samsung–Tesla foundry',     url: 'https://www.cnbc.com/2025/07/28/samsung-electronics-new-chip-supply-contract.html' },
  { source: 'Android Headlines',         article: "Apple AI server chips 'Baltra' — mass production 2026",              date: '2026-01', deals: 'Broadcom–Apple Baltra',     url: 'https://www.androidheadlines.com/2026/01/apple-ai-server-chips-baltra-mass-production-2026-kuo.html' },
  { source: 'Anthropic Blog',            article: 'Anthropic raises $30B Series G at $380B post-money valuation',       date: '2026-02', deals: 'Anthropic Series G',        url: 'https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation' },
  // Round 9 additions
  { source: 'xAI',                       article: 'xAI Raises $20B Series E',                                           date: '2026-01', deals: 'xAI Series E',              url: 'https://x.ai/news/series-e' },
  { source: 'Microsoft Blog',            article: 'The next chapter of the Microsoft–OpenAI partnership',               date: '2025-10', deals: 'MSFT–OpenAI equity, $250B Azure', url: 'https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/' },
  { source: 'SiliconANGLE',              article: 'Newly completed OpenAI restructuring gives Microsoft $135B stake',    date: '2025-10', deals: 'MSFT–OpenAI restructuring', url: 'https://siliconangle.com/2025/10/28/newly-completed-openai-restructuring-gives-microsoft-135b-stake/' },
  { source: 'Nscale',                    article: 'Nscale Contracts ~200,000 NVIDIA GB300 GPUs with Microsoft',          date: '2025-10', deals: 'Nscale–MSFT GPU infra',     url: 'https://www.nscale.com/press-releases/nscale-microsoft-2025' },
  { source: 'Silicon Republic',          article: 'Nscale to deploy 200,000 GPUs to Microsoft in reported $14bn deal',   date: '2025-10', deals: 'Nscale–MSFT GPU infra',     url: 'https://www.siliconrepublic.com/business/nscale-microsoft-data-centre-ai-infrastructure-nvidia-14bn' },
  { source: 'Quiver Quantitative',       article: 'Meta Expands AI Chip Ambitions With $2B Rivos Acquisition',          date: '2025',    deals: 'Meta–Rivos M&A',            url: 'https://www.quiverquant.com/news/Meta+(META)+Expands+AI+Chip+Ambitions+With+%242+Billion+Rivos+Acquisition' },
  { source: 'Wikipedia',                 article: 'io (company)',                                                       date: '2025',    deals: 'OpenAI–io Products M&A',    url: 'https://en.wikipedia.org/wiki/Io_(company)' },
  { source: 'CNBC',                      article: 'Nvidia, Microsoft, BlackRock part of $40B Aligned Data Centers deal', date: '2025-10', deals: 'AIP–Aligned M&A',           url: 'https://www.cnbc.com/2025/10/15/nvidia-microsoft-blackrock-aligned-data-centers.html' },
  { source: 'Reuters',                   article: 'BlackRock, Nvidia-backed group strikes $40B AI data center deal',    date: '2025-10', deals: 'AIP–Aligned M&A',           url: 'https://www.reuters.com/legal/transactional/blackrock-nvidia-buy-aligned-data-centers-40-billion-deal-2025-10-15/' },
  { source: 'Digital Watch Observatory', article: "Nvidia to invest $2bn in Elon Musk's xAI",                           date: '2025-10', deals: 'NVIDIA–xAI GPU lease',      url: 'https://dig.watch/updates/nvidia-to-invest-2bn-in-elon-musks-xai' },
  { source: 'CNBC',                      article: 'Meta signs $27B deal with Nebius for AI infrastructure',              date: '2026-03', deals: 'Nebius–Meta expansion',     url: 'https://www.cnbc.com/2026/03/16/meta-nebius-ai-infrastructure.html' },
  // Round 10 additions
  { source: 'CNBC',                      article: 'Google agrees to new $1B investment in Anthropic',                   date: '2025-01', deals: 'Google–Anthropic equity',    url: 'https://www.cnbc.com/2025/01/22/google-agrees-to-new-1-billion-investment-in-anthropic.html' },
  { source: 'SiliconANGLE',              article: 'AWS opens $11B Project Rainier data center campus built for Anthropic', date: '2025-10', deals: 'AWS–Anthropic cloud',     url: 'https://siliconangle.com/2025/10/29/aws-opens-11b-project-rainier-data-center-campus-built-anthropic/' },
  { source: 'SiliconANGLE',              article: 'Oracle reportedly buying 400K NVIDIA chips for first Stargate DC',    date: '2025-05', deals: 'Oracle–NVIDIA GPU',         url: 'https://siliconangle.com/2025/05/23/oracle-reportedly-buying-400000-nvidia-chips-for-first-stargate-data-center/' },
  { source: 'DataCenterDynamics',        article: 'Microsoft to invest $10B in CoreWeave by end of decade',              date: '2025',    deals: 'CoreWeave–Microsoft cloud', url: 'https://www.datacenterdynamics.com/en/news/microsoft-to-invest-10bn-in-coreweave-by-end-of-decade/' },
  { source: 'Lambda',                    article: 'Lambda announces multibillion-dollar agreement with Microsoft',       date: '2025-11', deals: 'Lambda–Microsoft cloud',    url: 'https://lambda.ai/blog/lambda-announces-multibillion-dollar-agreement-with-microsoft-to-deploy-ai-infrastructure-powered-by-tens-of-thousands-of-nvidia-gpus' },
  { source: 'TechCrunch',                article: 'OpenAI and Amazon ink $38B cloud computing deal',                     date: '2025-11', deals: 'OpenAI–AWS cloud',          url: 'https://techcrunch.com/2025/11/03/openai-and-amazon-ink-38b-cloud-computing-deal/' },
  { source: 'CNBC',                      article: 'Amazon closes at record after $38B OpenAI AWS deal',                  date: '2025-11', deals: 'OpenAI–AWS cloud',          url: 'https://www.cnbc.com/2025/11/03/open-ai-amazon-aws-cloud-deal.html' },
  { source: 'Reuters',                   article: 'OpenAI taps Google in unprecedented cloud deal despite AI rivalry',   date: '2025-06', deals: 'OpenAI–Google Cloud',       url: 'https://www.reuters.com/business/retail-consumer/openai-taps-google-unprecedented-cloud-deal-despite-ai-rivalry-sources-say-2025-06-10/' },
  { source: "Tom's Hardware",            article: 'Why NVIDIA just poured $2B into AI ASIC competitor Marvell',          date: '2026-03', deals: 'NVIDIA–Marvell equity',     url: 'https://www.tomshardware.com/tech-industry/nvidia-invests-2-billion-in-marvell-whose-biggest-clients-are-trying-to-replace-nvidia-chips' },
  { source: 'SiliconANGLE',              article: 'Meta agrees to buy millions more AI chips from NVIDIA',               date: '2026-02', deals: 'NVIDIA–Meta supply update', url: 'https://siliconangle.com/2026/02/17/meta-agrees-buy-millions-ai-chips-nvidia-raising-doubts-house-hardware/' },
  { source: 'MarketScreener / Reuters',  article: 'Meta extends custom chips deal with Broadcom to power AI ambitions',  date: '2026-04', deals: 'Broadcom–Meta MTIA update', url: 'https://www.marketscreener.com/news/meta-inks-deal-with-broadcom-for-custom-ai-chips-ce7e50dfd18cf221' },
]

const ROWS = RAW_ROWS.map((r, i) => ({ ...r, n: i + 1 }))

const COLUMNS = [
  { id: 'source',  label: 'Source',           width: '160px', nowrap: true   },
  { id: 'article', label: 'Article / Report', width: 'auto'                  },
  { id: 'date',    label: 'Date',             width: '90px',  nowrap: true   },
  { id: 'deals',   label: 'Deals Referenced', width: '240px'                 },
  { id: 'link',    label: 'Link',             width: '40px',  align: 'center' },
]

export default function SourcesSection() {
  const [sort, setSort] = useState({ column: 'date', direction: 'desc' })
  const [visibleCount, setVisibleCount] = useState(20)

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
  }, [sort])

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
      <h3 className={styles.sourcesHeading}>Data Sources</h3>
      <div className={styles.tableWrap}>
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
            {visible.map(r => (
              <tr key={r.n}>
                <td className={styles.sourcesCategoryCell}>{r.source}</td>
                <td>
                  {r.url ? (
                    <a className={styles.sourcesLink} href={r.url} target="_blank" rel="noreferrer">{r.article}</a>
                  ) : r.article}
                </td>
                <td>{r.date}</td>
                <td>{r.deals}</td>
                <td style={{ textAlign: 'center' }}>
                  {r.url ? (
                    <a className={styles.sourceLink} href={r.url} target="_blank" rel="noreferrer">↗</a>
                  ) : <span className={styles.fundingDash}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 0,
            fontSize: '12px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '6px 12px',
            }}>
              {sorted.length > visibleCount && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setVisibleCount(prev => prev + 20) }}
                  style={{ cursor: 'pointer', fontWeight: 400, color: 'var(--text)' }}
                >
                  Show 20 more
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
