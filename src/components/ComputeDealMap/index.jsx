import { useMemo, useState, useRef, useEffect } from 'react'

import styles from './styles.module.css'
import { DEALS } from './data.js'
import { applyFilters } from './logic.js'
import FilterBar from './FilterBar.jsx'
import Graph from './Graph.jsx'
import DealTable from './DealTable.jsx'
import SourcesSection from './SourcesSection.jsx'

export default function ComputeDealMap() {
  const [filters, setFilters] = useState({ dealType: 'all', category: 'all', search: '' })
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [scrollToDealId, setScrollToDealId] = useState(null)
  const [graphMaximized, setGraphMaximized] = useState(false)

  useEffect(() => {
    if (!graphMaximized) return
    const onKey = e => { if (e.key === 'Escape') setGraphMaximized(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [graphMaximized])

  const filteredDeals = useMemo(() => applyFilters(DEALS, filters), [filters])

  const leftColRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(0)

  useEffect(() => {
    if (!leftColRef.current) return
    const update = () => {
      const h = leftColRef.current?.getBoundingClientRect().height || 0
      setLeftHeight(prev => Math.abs(prev - h) < 0.5 ? prev : h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(leftColRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <section className={styles.section}>
      <div className={styles.topSection}>
        <div ref={leftColRef} className={styles.leftColumn}>
          <p className={styles.subtitle}>
            I follow the defense tech and biotech application layers, frontier AI labs, AI hardware providers, and those hardware providers' hardware providers. I write about my observations and sometimes share my investment theses.
          </p>
          <p className={styles.subtitle}>
            NVIDIA's Margin Illusion{' '}
            <a className={styles.subtitleLink} href="https://x.com/jstwng/status/2043548372016279859" target="_blank" rel="noreferrer">[X]</a>{' '}
            <a className={styles.subtitleLink} href="https://substack.com/home/post/p-194031594" target="_blank" rel="noreferrer">[Substack]</a>
          </p>
          <p className={styles.subtitle}>
            A Note on Co-Packaged Optics{' '}
            <a className={styles.subtitleLink} href="https://x.com/jstwng/status/2029967415921070578?s=20" target="_blank" rel="noreferrer">[X]</a>{' '}
            <a className={styles.subtitleLink} href="https://docs.google.com/document/d/1TwtnYDb-98azwzXIaBdkBe55RU522qBGYBz4rWFL7wE/edit?tab=t.0" target="_blank" rel="noreferrer">[Google Doc]</a>
          </p>
          <p className={styles.subtitle}>
            AMD Software Composability Thesis{' '}
            <a className={styles.subtitleLink} href="https://x.com/jstwng/status/2032999807699001626?s=20" target="_blank" rel="noreferrer">[X]</a>
          </p>
          <p className={styles.subtitle}>
            Sustainable Growth for an Intelligent Economy{' '}
            <a className={styles.subtitleLink} href="https://drive.google.com/file/d/1yoY0lIEM9x4nipvQ5KHhXf_QUGgH4SSg/view?usp=sharing" target="_blank" rel="noreferrer">[PDF]</a>
          </p>
          <p className={styles.subtitle}>
            I maintain a structured, source-backed dataset of publicly disclosed AI infrastructure deals. I've built a public repository that houses this dataset and below is a simple visualization layer built on top of it.
          </p>
        </div>
        <Graph
          deals={filteredDeals}
          hoveredEdge={hoveredEdge}
          onHoverEdge={setHoveredEdge}
          hoveredNode={hoveredNode}
          onHoverNode={setHoveredNode}
          onScrollToRow={id => setScrollToDealId(id)}
          heightOverride={leftHeight}
          onRequestMaximize={() => setGraphMaximized(true)}
        />
      </div>
      {graphMaximized && (
        <div
          className={styles.graphModalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded graph view"
          onClick={() => setGraphMaximized(false)}
        >
          <div
            className={styles.graphModalFrame}
            onClick={e => e.stopPropagation()}
          >
            <Graph
              deals={filteredDeals}
              hoveredEdge={hoveredEdge}
              onHoverEdge={setHoveredEdge}
              hoveredNode={hoveredNode}
              onHoverNode={setHoveredNode}
              onScrollToRow={id => setScrollToDealId(id)}
              isModal
              maximizable={false}
              onRequestClose={() => setGraphMaximized(false)}
            />
          </div>
        </div>
      )}
      <h3 className={styles.sectionSubheader}>Transactions</h3>
      <FilterBar filters={filters} onChange={setFilters} />
      <DealTable deals={filteredDeals} hoveredEdge={hoveredEdge} scrollToDealId={scrollToDealId} onHoverEdge={setHoveredEdge} />
      <SourcesSection />
    </section>
  )
}
