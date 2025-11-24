import { useMemo, useState, useEffect } from 'react'
import styles from './components/ComputeDealMap/styles.module.css'
import { DEALS } from './components/ComputeDealMap/data.js'
import { applyFilters } from './components/ComputeDealMap/logic.js'
import FilterBar from './components/ComputeDealMap/FilterBar.jsx'
import Graph from './components/ComputeDealMap/Graph.jsx'
import DealTable from './components/ComputeDealMap/DealTable.jsx'
import SourcesSection from './components/ComputeDealMap/SourcesSection.jsx'

export default function App() {
  const [filters, setFilters] = useState({ dealType: 'all', category: 'all', search: '' })
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [scrollToDealId, setScrollToDealId] = useState(null)
  const [graphMaximized, setGraphMaximized] = useState(false)

  const filteredDeals = useMemo(() => applyFilters(DEALS, filters), [filters])

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

  return (
    <div className="computePage">
      <header className="computeHeader">
        <h1 className="computeTitle">ai ecosystem transactions</h1>
        <p className="computeTagline">
          a structured, source-backed dataset of publicly disclosed ai ecosystem transactions across sovereign AI, hyperscaler capex, custom silicon, and the hardware providers behind them. maintained by justin wang. source data public repository{' '}
          <a href="https://github.com/jstwng/compute-deal-map-data" target="_blank" rel="noreferrer">here</a>.
        </p>
      </header>

      <section className={styles.section}>
        <div className="graphBlock">
          <Graph
            deals={filteredDeals}
            hoveredEdge={hoveredEdge}
            onHoverEdge={setHoveredEdge}
            hoveredNode={hoveredNode}
            onHoverNode={setHoveredNode}
            onScrollToRow={id => setScrollToDealId(id)}
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
        <DealTable
          deals={filteredDeals}
          hoveredEdge={hoveredEdge}
          scrollToDealId={scrollToDealId}
          onHoverEdge={setHoveredEdge}
        />
        <SourcesSection />
      </section>

      <footer className="computeFooter">
        <span>
          &copy; {new Date().getFullYear()} Justin Wang &middot;{' '}
          <a href="https://jstwng.com" target="_blank" rel="noreferrer">jstwng.com</a>
        </span>
      </footer>
    </div>
  )
}
