import { useEffect, useRef, useState } from 'react'
import { EDGE_TYPES } from './content/parseFlows.ts'
import { frames, prototype } from './content/prototype.ts'
import { DeviceContext } from './device/DeviceContext.ts'
import type { Beat, Edge, EdgeType, Issue } from './content/parseFlows.ts'
import { BeatPanel } from './viewer/BeatPanel.tsx'
import { FlowMap } from './viewer/FlowMap.tsx'
import { LiveStage } from './viewer/LiveStage.tsx'

const { product, issues } = prototype

type Route = {
  view: 'map' | 'live'
  beatId: string | null
  /** Device id, from ?device= in the hash. The first device is the default. */
  device: string
}

function allBeats() {
  return product.flows.flatMap((flow) => flow.beats)
}

function parseHash(): Route {
  const [hash, query = ''] = window.location.hash.replace(/^#/, '').split('?')
  const asked = new URLSearchParams(query).get('device')
  const device = frames.find((frame) => frame.id === asked)?.id ?? frames[0].id
  const live = /^\/live\/([0-9S]+\.[0-9]+)$/.exec(hash)
  if (live) return { view: 'live', beatId: live[1], device }
  const map = /^\/map\/([0-9S]+\.[0-9]+)$/.exec(hash)
  if (map) return { view: 'map', beatId: map[1], device }
  return { view: 'map', beatId: null, device }
}

function writeHash(route: Route) {
  const path =
    route.view === 'live' && route.beatId
      ? `#/live/${route.beatId}`
      : route.beatId
        ? `#/map/${route.beatId}`
        : '#/map'
  const next = route.device === frames[0].id ? path : `${path}?device=${route.device}`
  if (window.location.hash !== next) window.location.hash = next
}

function firstBeat(of?: Beat) {
  const flow = of ? product.flows.find((item) => item.id === of.flowId) : product.flows[0]
  return flow?.beats[0] ?? allBeats()[0]
}

export default function App() {
  const byId = new Map(allBeats().map((beat) => [beat.id, beat]))
  const [route, setRoute] = useState<Route>(parseHash)
  const [hiddenEdges, setHiddenEdges] = useState<Set<EdgeType>>(() => new Set())

  useEffect(() => {
    document.title = product.name ? `${product.name} · Flow map` : 'Flow map'
    if (!window.location.hash) writeHash({ view: 'map', beatId: null, device: frames[0].id })
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const selected = route.beatId ? byId.get(route.beatId) : undefined
  const frame = frames.find((item) => item.id === route.device) ?? frames[0]
  const errors = issues.filter((item) => item.level === 'error')
  const hints = issues.filter((item) => item.level === 'hint')
  const otherErrors = errors.filter((item) => !item.placeholder)
  const missingScreens = errors.length - otherErrors.length

  function go(next: Omit<Route, 'device'> & { device?: string }) {
    writeHash({ ...next, device: next.device ?? route.device })
  }

  function toggleEdge(type: EdgeType) {
    setHiddenEdges((current) => {
      const next = new Set(current)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function follow(edge: Edge) {
    if (!byId.has(edge.target)) return
    go({ view: 'live', beatId: edge.target })
  }

  return (
    <DeviceContext.Provider value={frame}>
      <a className="skip" href={route.view === 'map' ? '#flow-map' : '#live-phone'}>
        Skip to {route.view === 'map' ? 'map' : 'phone'}
      </a>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Flow map · {frame.label}</p>
            <h1>{product.name}</h1>
          </div>
          <div className="view-switch" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={route.view === 'map'}
              onClick={() => go({ view: 'map', beatId: route.beatId })}
            >
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={route.view === 'live'}
              onClick={() => go({ view: 'live', beatId: selected?.id ?? firstBeat()?.id ?? null })}
            >
              Live
            </button>
          </div>
          {frames.length > 1 ? (
            <div className="view-switch" role="group" aria-label="Device">
              {frames.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === frame.id}
                  onClick={() => go({ view: route.view, beatId: route.beatId, device: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
          {route.view === 'map' ? <EdgeLegend hidden={hiddenEdges} onToggle={toggleEdge} /> : null}
          <IssueSummary missingScreens={missingScreens} otherErrors={otherErrors} hints={hints} />
        </header>

        {route.view === 'map' ? (
          <div className={selected ? 'map-wrap' : 'map-wrap panel-closed'} id="flow-map">
            <FlowMap
              key={frame.id}
              selectedId={selected?.id ?? null}
              hidden={hiddenEdges}
              onSelect={(beatId) => go({ view: 'map', beatId })}
              onOpenLive={(beatId) => go({ view: 'live', beatId })}
            />
            {selected ? (
              <BeatPanel
                beat={selected}
                onClose={() => go({ view: 'map', beatId: null })}
                onOpenLive={() => go({ view: 'live', beatId: selected.id })}
                onSelect={(beatId) => go({ view: 'map', beatId })}
              />
            ) : null}
          </div>
        ) : (
          <div id="live-phone">
            <LiveStage
              beat={selected ?? firstBeat()}
              onFollow={follow}
              onRestart={() => {
                const start = firstBeat(selected)
                if (start) go({ view: 'live', beatId: start.id })
              }}
              onOverview={() => go({ view: 'map', beatId: selected?.id ?? null })}
            />
          </div>
        )}
      </div>
    </DeviceContext.Provider>
  )
}

function EdgeLegend({ hidden, onToggle }: { hidden: Set<EdgeType>; onToggle: (type: EdgeType) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ left: false, right: false })

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth
      setFade({
        left: el.scrollLeft > 1,
        right: max - el.scrollLeft > 1,
      })
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={`legend-clip${fade.left ? ' can-scroll-left' : ''}${fade.right ? ' can-scroll-right' : ''}`}>
      <div className="legend" ref={scroller} role="group" aria-label="Edge types">
        {EDGE_TYPES.map((type) => {
          const on = !hidden.has(type)
          return (
            <button
              key={type}
              type="button"
              className={on ? 'legend-item' : 'legend-item is-off'}
              aria-pressed={on}
              onClick={() => onToggle(type)}
            >
              <span className={`legend-swatch swatch-${type}`} aria-hidden="true" />
              {type}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IssueSummary({
  missingScreens,
  otherErrors,
  hints,
}: {
  missingScreens: number
  otherErrors: Issue[]
  hints: Issue[]
}) {
  if (missingScreens === 0 && otherErrors.length === 0 && hints.length === 0) return null

  return (
    <details className="issue-summary">
      <summary>
        {missingScreens > 0 ? `${missingScreens} placeholders` : 'Screens ready'}
        {hints.length > 0 ? ` · ${hints.length} unhappy-path gaps` : ''}
        {otherErrors.length > 0 ? ` · ${otherErrors.length} errors` : ''}
      </summary>
      {otherErrors.length > 0 ? (
        <ul className="banner banner-error">
          {otherErrors.map((item) => (
            <li key={item.message}>{item.message}</li>
          ))}
        </ul>
      ) : null}
      {hints.length > 0 ? (
        <ul>
          {hints.map((item) => (
            <li key={item.message}>{item.message}</li>
          ))}
        </ul>
      ) : null}
    </details>
  )
}
