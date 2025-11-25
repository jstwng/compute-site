import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'
import styles from './styles.module.css'
import { COMPANIES, findCompany } from './companies.js'
import DealCard from './DealCard.jsx'
import CompanyCard from './CompanyCard.jsx'

const NODE_WIDTH = 100
const NODE_HEIGHT = 36
const MARGIN = 15
const MIN_GAP = 8
// Horizontal padding inside a node when its label overflows the default
// width. Mirrors the ~5px top/bottom padding above and below the name/ticker
// stack in a 36px-tall node.
const NODE_HPAD = 5

// Canvas-based text measurement. Cached canvas + font string; runs on first
// call and for each unique label as nodes enter the graph.
function measureNodeText(text) {
  if (!text) return 0
  if (typeof document === 'undefined') return text.length * 7
  const canvas = measureNodeText._c || (measureNodeText._c = document.createElement('canvas'))
  const ctx = canvas.getContext('2d')
  ctx.font = '400 12px Inter, system-ui, -apple-system, sans-serif'
  return ctx.measureText(text).width
}

// Node width: the default NODE_WIDTH when the longer of name/ticker fits
// comfortably, otherwise grown to fit the label plus symmetric padding.
function nodeWidthFor(company) {
  const nameW = measureNodeText(company.name)
  const tickerW = company.ticker ? measureNodeText(company.ticker) : 0
  const needed = Math.max(nameW, tickerW) + NODE_HPAD * 2
  return Math.max(NODE_WIDTH, Math.ceil(needed))
}
// Force-directed layouts never pack to full grid capacity — collision + spring
// forces need slack. 0.7 is the empirical ceiling before removeAllOverlaps
// starts pushing nodes to the frame edge.
const PACK_FILL = 0.7
const MIN_NODE_CAP = 6

// Maximum number of nodes that can be rendered without overlap in a box of
// the given dimensions. Derived from grid capacity × a fill factor that
// accounts for the irregular packing of a force-directed layout.
function computeMaxNodes(width, height) {
  const usableW = Math.max(0, width - 2 * MARGIN)
  const usableH = Math.max(0, height - 2 * MARGIN)
  const cols = Math.floor(usableW / (NODE_WIDTH + MIN_GAP))
  const rows = Math.floor(usableH / (NODE_HEIGHT + MIN_GAP))
  const gridCapacity = Math.max(0, cols * rows)
  return Math.max(MIN_NODE_CAP, Math.floor(gridCapacity * PACK_FILL))
}

// Degree map over a set of directed edges (counting undirected co-occurrence).
function degreeMap(edges) {
  const m = new Map()
  edges.forEach(e => {
    m.set(e.source, (m.get(e.source) || 0) + 1)
    m.set(e.target, (m.get(e.target) || 0) + 1)
  })
  return m
}

// Choose which nodes render. If no focus: top-N by degree within the main
// connected component. If focused: focused node + top-(N-1) of its direct
// neighbors by global degree. Ties broken by name for determinism.
function selectVisibleNodes(graphDeals, focusedNode, max) {
  const degrees = degreeMap(graphDeals)
  const cmp = (a, b) => (degrees.get(b) || 0) - (degrees.get(a) || 0) || a.localeCompare(b)

  if (focusedNode) {
    const neighbors = new Set()
    graphDeals.forEach(d => {
      if (d.source === focusedNode) neighbors.add(d.target)
      else if (d.target === focusedNode) neighbors.add(d.source)
    })
    const ranked = [...neighbors].sort(cmp).slice(0, Math.max(0, max - 1))
    return new Set([focusedNode, ...ranked])
  }

  const allNames = new Set()
  graphDeals.forEach(d => { allNames.add(d.source); allNames.add(d.target) })
  const mainComponent = largestComponent([...allNames], graphDeals)
  const ranked = [...mainComponent].sort(cmp).slice(0, max)
  return new Set(ranked)
}

// Hard-constraint overlap remover. Must run LAST — nothing modifies node
// positions after this returns. Up to 50 passes, early exit once the largest
// remaining overlap is under 0.5px. Boundary clamp happens INSIDE each pass.
function removeAllOverlaps(nodes, h, minGap, svgW, svgH) {
  nodes.sort((a, b) => a.x - b.x)
  const edgeMargin = MARGIN
  for (let pass = 0; pass < 50; pass++) {
    let maxOverlap = 0
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const reqX = (a.w + b.w) / 2 + minGap
        const reqY = h + minGap
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2)
        const dy = (b.y + h / 2) - (a.y + h / 2)
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx < reqX && absDy < reqY) {
          const ox = reqX - absDx
          const oy = reqY - absDy
          maxOverlap = Math.max(maxOverlap, Math.min(ox, oy))
          if (ox < oy) {
            const shift = ox / 2 + 0.5
            if (dx >= 0) { a.x -= shift; b.x += shift }
            else         { a.x += shift; b.x -= shift }
          } else {
            const shift = oy / 2 + 0.5
            if (dy >= 0) { a.y -= shift; b.y += shift }
            else         { a.y += shift; b.y -= shift }
          }
        }
      }
    }
    nodes.forEach(d => {
      d.x = Math.max(edgeMargin, Math.min(svgW - d.w - edgeMargin, d.x))
      d.y = Math.max(edgeMargin, Math.min(svgH - h - edgeMargin, d.y))
    })
    if (maxOverlap < 0.5) break
  }

  // Verification
  let count = 0
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const reqX = (a.w + b.w) / 2 + minGap
      const dx = Math.abs((a.x + a.w / 2) - (b.x + b.w / 2))
      const dy = Math.abs((a.y + h / 2) - (b.y + h / 2))
      if (dx < reqX && dy < h + minGap) {
        console.error(`Graph overlap: ${a.id} ↔ ${b.id} (dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)})`)
        count++
      }
    }
  }
  if (count === 0 && typeof console !== 'undefined') console.log('Graph overlap check: 0')
  return nodes
}

// True force-directed layout. High-degree nodes settle near center because
// their net force from many edges roughly cancels out. Low-degree nodes
// drift to the periphery. No zone boundaries.
// Largest connected component of a node-edge graph.
function largestComponent(nodeNames, edges) {
  if (!nodeNames.length) return new Set()
  const adj = new Map(nodeNames.map(n => [n, new Set()]))
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).add(e.target)
      adj.get(e.target).add(e.source)
    }
  })
  const seen = new Set()
  let best = new Set()
  for (const start of nodeNames) {
    if (seen.has(start)) continue
    const comp = new Set()
    const queue = [start]
    while (queue.length) {
      const n = queue.shift()
      if (seen.has(n)) continue
      seen.add(n)
      comp.add(n)
      adj.get(n).forEach(nb => { if (!seen.has(nb)) queue.push(nb) })
    }
    if (comp.size > best.size) best = comp
  }
  return best
}

function computeGraphLayout(deals, width, height, focusedNode) {
  const graphDeals = deals.filter(d => d.deal_type !== 'funding_round' && d.source !== d.target)

  const maxNodes = computeMaxNodes(width, height)
  const visible = selectVisibleNodes(graphDeals, focusedNode, maxNodes)
  const componentDeals = graphDeals.filter(d => visible.has(d.source) && visible.has(d.target))

  const nodes = COMPANIES
    .filter(c => visible.has(c.name))
    .map((c, i, arr) => {
      const angle = (i / arr.length) * Math.PI * 2
      const r = Math.min(width, height) / 3
      return {
        id: c.name,
        company: c,
        w: nodeWidthFor(c),
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
      }
    })
  const nodesById = new Map(nodes.map(n => [n.id, n]))
  const links = componentDeals
    .filter(d => nodesById.has(d.source) && nodesById.has(d.target))
    .map(d => ({ source: d.source, target: d.target }))

  if (nodes.length === 0) return { positions: new Map(), visible }

  // Separate X/Y forces with weak Y centering — lets nodes spread vertically
  // instead of clustering along a horizontal band.
  // Per-node collision radius from each node's own diagonal + margin.
  const sim = forceSimulation(nodes)
    .force('link', forceLink(links).id(d => d.id).distance(120).strength(0.5))
    .force('charge', forceManyBody().strength(-1000))
    .force('x', forceX(width / 2).strength(0.05))
    .force('y', forceY(height / 2).strength(0.02))
    .force('collide', forceCollide()
      .radius(d => Math.sqrt((d.w / 2) ** 2 + (NODE_HEIGHT / 2) ** 2) + MIN_GAP)
      .strength(1)
      .iterations(10))
    .alphaDecay(0.005)
    .velocityDecay(0.4)
    .stop()

  for (let i = 0; i < 1000; i++) sim.tick()

  // Rescale node cloud to fill available area. Use the widest node as the
  // horizontal guard so the widest cell still fits after scaling.
  const padding = 30
  const maxNodeW = Math.max(...nodes.map(n => n.w))
  const xs = nodes.map(d => d.x)
  const ys = nodes.map(d => d.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = Math.max(1, maxX - minX)
  const spanY = Math.max(1, maxY - minY)
  const scaleX = (width - 2 * padding - maxNodeW) / spanX
  const scaleY = (height - 2 * padding - NODE_HEIGHT) / spanY
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  // Post-rescale placement (top-left corner coords). Clamp per-node width.
  const placed = nodes.map(n => {
    const sx = (n.x - cx) * scaleX + width / 2
    const sy = (n.y - cy) * scaleY + height / 2
    return {
      id: n.id,
      company: n.company,
      w: n.w,
      x: Math.max(MARGIN, Math.min(width - MARGIN - n.w, sx - n.w / 2)),
      y: Math.max(MARGIN, Math.min(height - MARGIN - NODE_HEIGHT, sy - NODE_HEIGHT / 2)),
    }
  })

  removeAllOverlaps(placed, NODE_HEIGHT, MIN_GAP, width, height)

  const positions = new Map()
  placed.forEach(p => positions.set(p.id, { x: p.x, y: p.y, w: p.w, company: p.company }))

  return { positions, visible }
}

function nodeCenter(pos) {
  return { x: pos.x + pos.w / 2, y: pos.y + NODE_HEIGHT / 2 }
}


export default function Graph({ deals, hoveredEdge, onHoverEdge, hoveredNode, onHoverNode, onScrollToRow, heightOverride, maximizable = true, onRequestMaximize, onRequestClose, isModal = false }) {
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [cardPinned, setCardPinned] = useState(false)
  const [focusedNode, setFocusedNode] = useState(null)
  const [hoveringCanvas, setHoveringCanvas] = useState(false)
  const wrapRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 380 })

  // Measure wrapper for 1:1 viewBox (constant pixel sizes for node/text)
  const updateDims = useCallback(() => {
    if (!wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      setDims(prev =>
        Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height }
      )
    }
  }, [])

  useEffect(() => {
    updateDims()
    const ro = new ResizeObserver(updateDims)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [updateDims])

  const { positions, visible } = useMemo(
    () => computeGraphLayout(deals, dims.w, dims.h, focusedNode),
    [deals, dims.w, dims.h, focusedNode]
  )

  // If filters drop the focused node out of the dataset, reset focus.
  useEffect(() => {
    if (focusedNode && visible && !visible.has(focusedNode)) setFocusedNode(null)
  }, [focusedNode, visible])

  // Each individual deal renders as its own edge (skip funding rounds + self-loops).
  // Restricted to edges where both endpoints are currently rendered.
  const graphDeals = useMemo(
    () => deals.filter(d =>
      d.deal_type !== 'funding_round' &&
      d.source !== d.target &&
      visible && visible.has(d.source) && visible.has(d.target)
    ),
    [deals, visible]
  )

  const hoverKey = hoveredEdge ? `${hoveredEdge.source}__${hoveredEdge.target}` : null

  // Companies directly connected to the hovered node (via any edge)
  const connectedNodeNames = useMemo(() => {
    if (!hoveredNode) return null
    const set = new Set([hoveredNode])
    graphDeals.forEach(d => {
      if (d.source === hoveredNode) set.add(d.target)
      if (d.target === hoveredNode) set.add(d.source)
    })
    return set
  }, [hoveredNode, graphDeals])

  const hoveredNodes = useMemo(() => {
    if (hoveredNode || !hoveredEdge) return null
    return new Set([hoveredEdge.source, hoveredEdge.target])
  }, [hoveredNode, hoveredEdge])

  // Aggregate deals for hovered node (CompanyCard)
  const hoveredCompanyDeals = useMemo(() => {
    if (!hoveredNode) return []
    return deals
      .filter(d => d.source === hoveredNode || d.target === hoveredNode)
      .map(d => ({ ...d, counterparty: d.source === hoveredNode ? d.target : d.source }))
  }, [hoveredNode, deals])

  // Aggregate edge for DealCard (when hovering any of the pair's edges)
  const hoveredEdgeAggregate = useMemo(() => {
    if (!hoveredEdge) return null
    const pairDeals = graphDeals.filter(
      d => d.source === hoveredEdge.source && d.target === hoveredEdge.target
    )
    if (!pairDeals.length) return null
    const totalValue = pairDeals.reduce((s, d) => s + (d.value_billions || 0), 0)
    return {
      source: hoveredEdge.source,
      target: hoveredEdge.target,
      deals: pairDeals,
      totalValue,
    }
  }, [hoveredEdge, graphDeals])

  return (
    <div
      ref={wrapRef}
      className={styles.graphWrap}
      style={heightOverride > 0 ? { height: `${heightOverride}px` } : undefined}
      onMouseEnter={() => setHoveringCanvas(true)}
      onMouseLeave={() => setHoveringCanvas(false)}
      onMouseMove={e => {
        const rect = wrapRef.current?.getBoundingClientRect()
        setCursor({
          x: rect ? e.clientX - rect.left : e.clientX,
          y: rect ? e.clientY - rect.top : e.clientY,
        })
      }}
    >
      {focusedNode && (
        <button
          type="button"
          className={styles.graphReset}
          onClick={() => { setFocusedNode(null); onHoverNode(null); setCardPinned(false) }}
        >
          Reset view
        </button>
      )}
      {isModal && onRequestClose && (
        <button
          type="button"
          className={styles.graphClose}
          onClick={onRequestClose}
          aria-label="Close expanded graph"
        >
          <svg
            className={styles.graphCloseIcon}
            width="9"
            height="9"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M1 1 L11 11 M11 1 L1 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
          <span>Close</span>
        </button>
      )}
      {maximizable && !isModal && hoveringCanvas && !hoveredNode && (
        <button
          type="button"
          className={styles.graphExpandHint}
          onClick={e => { e.stopPropagation(); onRequestMaximize && onRequestMaximize() }}
          aria-label="Expand graph"
        >
          <svg
            className={styles.graphExpandIcon}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M1 4 V1 H4 M8 1 H11 V4 M11 8 V11 H8 M4 11 H1 V8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
          </svg>
          <span>Click anywhere to expand</span>
        </button>
      )}
      <svg
        className={styles.graphSvg}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Compute deal relationship graph"
        onClick={e => {
          if (e.target !== e.currentTarget) return
          if (maximizable && !isModal && onRequestMaximize) onRequestMaximize()
        }}
      >
        <g>
          {graphDeals.map(d => {
            const src = positions.get(d.source)
            const tgt = positions.get(d.target)
            if (!src || !tgt) return null
            const a = nodeCenter(src)
            const b = nodeCenter(tgt)
            const pairKey = `${d.source}__${d.target}`
            const isPairHovered = hoverKey === pairKey

            let opacity, sw
            if (hoveredNode) {
              const connected = d.source === hoveredNode || d.target === hoveredNode
              opacity = connected ? 1 : 0.10
              sw = connected ? 1.75 : 1
            } else if (hoverKey) {
              opacity = isPairHovered ? 1 : 0.10
              sw = isPairHovered ? 1.75 : 1
            } else {
              opacity = 0.35
              sw = 1
            }

            return (
              <line
                key={d.id}
                className={styles.edgeLine}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                strokeWidth={sw}
                opacity={opacity}
                style={{ transition: 'opacity 150ms ease, stroke-width 150ms ease', cursor: hoveredNode ? 'default' : 'pointer' }}
                aria-label={`${d.source} to ${d.target}: ${d.deal_type}`}
                onMouseEnter={() => { if (!hoveredNode) onHoverEdge({ source: d.source, target: d.target }) }}
                onMouseLeave={() => { if (!hoveredNode) onHoverEdge(null) }}
              />
            )
          })}
        </g>
        <g>
          {[...positions.values()].map(({ x, y, w, company }) => {
            return (
              <g
                key={company.name}
                transform={`translate(${x}, ${y})`}
                style={{ transition: 'transform 300ms ease-out', cursor: 'pointer' }}
                onMouseEnter={() => onHoverNode(company.name)}
                onMouseLeave={() => { if (!cardPinned) onHoverNode(null) }}
                onClick={e => {
                  e.stopPropagation()
                  setFocusedNode(company.name === focusedNode ? null : company.name)
                }}
              >
                <rect
                  className={styles.nodeRect}
                  width={w}
                  height={NODE_HEIGHT}
                  rx={0}
                  ry={0}
                />
                <text
                  className={styles.nodeName}
                  x={w / 2}
                  y={NODE_HEIGHT / 2 - 4}
                  textAnchor="middle"
                >
                  {company.name}
                </text>
                {company.ticker && (
                  <text
                    className={styles.nodeTicker}
                    x={w / 2}
                    y={NODE_HEIGHT / 2 + 10}
                    textAnchor="middle"
                  >
                    {company.ticker}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {!hoveredNode && hoveredEdgeAggregate && (() => {
        const src = positions.get(hoveredEdge.source)
        const tgt = positions.get(hoveredEdge.target)
        const midX = src && tgt ? (src.x + src.w / 2 + tgt.x + tgt.w / 2) / 2 : cursor.x
        const midY = src && tgt ? (src.y + NODE_HEIGHT / 2 + tgt.y + NODE_HEIGHT / 2) / 2 : cursor.y
        return (
          <DealCard
            edge={hoveredEdgeAggregate}
            x={midX}
            y={midY}
            containerWidth={dims.w}
            containerHeight={dims.h}
          />
        )
      })()}
      {hoveredNode && (() => {
        const node = positions.get(hoveredNode)
        // Flip placement above/below the node based on whether the node
        // sits in the top or bottom half of the graph — keeps the card
        // inside the visible area instead of getting clipped at the bottom.
        const nodeMidY = node ? node.y + NODE_HEIGHT / 2 : cursor.y
        const placement = nodeMidY > dims.h / 2 ? 'above' : 'below'
        const anchorX = node ? node.x : cursor.x
        const anchorY = node
          ? (placement === 'above' ? node.y - 8 : node.y + NODE_HEIGHT + 8)
          : cursor.y
        return (
          <CompanyCard
            company={findCompany(hoveredNode)}
            deals={hoveredCompanyDeals}
            x={anchorX}
            y={anchorY}
            containerWidth={dims.w}
            containerHeight={dims.h}
            placement={placement}
            onScrollToRow={onScrollToRow}
            onMouseEnter={() => setCardPinned(true)}
            onMouseLeave={() => { setCardPinned(false); onHoverNode(null) }}
          />
        )
      })()}
    </div>
  )
}
