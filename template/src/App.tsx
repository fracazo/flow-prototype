import { useEffect, useState } from 'react'
import { prototype } from './content/parseFlows.ts'
import { frameOf } from './device/devices.ts'
import type { Beat, Edge, Issue } from './content/parseFlows.ts'
import { BeatPanel } from './viewer/BeatPanel.tsx'
import { FlowMap } from './viewer/FlowMap.tsx'
import { LiveStage } from './viewer/LiveStage.tsx'

const { product, issues } = prototype
const frame = frameOf(product.device).frame

type Route = {
  view: 'map' | 'live'
  beatId: string | null
}

function allBeats() {
  return product.flows.flatMap((flow) => flow.beats)
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '')
  const live = /^\/live\/([0-9S]+\.[0-9]+)$/.exec(hash)
  if (live) return { view: 'live', beatId: live[1] }
  const map = /^\/map\/([0-9S]+\.[0-9]+)$/.exec(hash)
  if (map) return { view: 'map', beatId: map[1] }
  return { view: 'map', beatId: null }
}

function writeHash(route: Route) {
  const next =
    route.view === 'live' && route.beatId
      ? `#/live/${route.beatId}`
      : route.beatId
        ? `#/map/${route.beatId}`
        : '#/map'
  if (window.location.hash !== next) window.location.hash = next
}

function firstBeat(of?: Beat) {
  const flow = of ? product.flows.find((item) => item.id === of.flowId) : product.flows[0]
  return flow?.beats[0] ?? allBeats()[0]
}

export default function App() {
  const byId = new Map(allBeats().map((beat) => [beat.id, beat]))
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    document.title = product.name ? `${product.name} · Flow map` : 'Flow map'
    if (!window.location.hash) writeHash({ view: 'map', beatId: null })
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const selected = route.beatId ? byId.get(route.beatId) : undefined
  const errors = issues.filter((item) => item.level === 'error')
  const hints = issues.filter((item) => item.level === 'hint')
  const otherErrors = errors.filter((item) => !item.message.includes('no screen component'))
  const missingScreens = errors.length - otherErrors.length

  function go(next: Route) {
    writeHash(next)
  }

  function follow(edge: Edge) {
    if (!byId.has(edge.target)) return
    go({ view: 'live', beatId: edge.target })
  }

  return (
    <>
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
          <IssueSummary missingScreens={missingScreens} otherErrors={otherErrors} hints={hints} />
        </header>

        {route.view === 'map' ? (
          <div className={selected ? 'map-wrap' : 'map-wrap panel-closed'} id="flow-map">
            <FlowMap
              selectedId={selected?.id ?? null}
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
    </>
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
