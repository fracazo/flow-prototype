import { useCallback, useEffect, useRef, useState } from 'react'
import { frames, hasScreen, prototype } from './content/prototype.ts'
import { DeviceContext } from './device/DeviceContext.ts'
import type { Beat, Edge, EdgeType } from './content/parseFlows.ts'
import { BeatPanel } from './viewer/BeatPanel.tsx'
import { FlowMap, type Camera, type CameraOptions } from './viewer/FlowMap.tsx'
import { LiveStage } from './viewer/LiveStage.tsx'
import { TopBar } from './viewer/TopBar.tsx'

const { product, issues } = prototype

// ?present hides the chrome for recording. It can sit before the hash or in it:
// /?present#/map or #/map?present. &intro builds the map in on load.
const flags = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.split('?')[1] ?? ''}`)
const PRESENT = flags.has('present')
const INTRO = PRESENT && flags.has('intro')

/** The scripted camera, on window.flow in presentation mode only. See "Recording a demo" in SKILL.md. */
export type FlowApi = {
  focus: (beatId: string, options?: CameraOptions) => Promise<boolean>
  fit: (options?: Omit<CameraOptions, 'zoom'> & { padding?: number }) => Promise<boolean>
  select: (beatId: string | null) => Promise<void>
  live: (beatId?: string) => Promise<void>
  device: (id: string) => Promise<void>
  /** Resolves when the map is laid out and the intro, if any, has played. */
  ready: () => Promise<void>
}

declare global {
  interface Window {
    flow?: FlowApi
  }
}

/** Two frames: the hash change has rendered and the browser has painted it. */
function painted() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

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
  const query = [route.device === frames[0].id ? '' : `device=${route.device}`, PRESENT ? 'present' : '']
    .filter(Boolean)
    .join('&')
  const next = query ? `${path}?${query}` : path
  if (window.location.hash !== next) window.location.hash = next
}

function firstBeat(of?: Beat) {
  const flow = of ? product.flows.find((item) => item.id === of.flowId) : product.flows[0]
  return flow?.beats[0] ?? allBeats()[0]
}

export default function App() {
  const byId = new Map(allBeats().map((beat) => [beat.id, beat]))
  const [route, setRoute] = useState<Route>(parseHash)
  // Back edges double every forward edge, so they start hidden. The key turns them on.
  const [hiddenEdges, setHiddenEdges] = useState<Set<EdgeType>>(() => new Set(['back']))
  const routeRef = useRef(route)
  routeRef.current = route
  const intro = useRef(INTRO)
  const camera = useRef<Camera | null>(null)
  const cameraWaiters = useRef<((camera: Camera) => void)[]>([])

  useEffect(() => {
    document.title = product.name ? `${product.name} · Flow prototype` : 'Flow prototype'
    if (!window.location.hash) writeHash({ view: 'map', beatId: null, device: frames[0].id })
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const selected = route.beatId ? byId.get(route.beatId) : undefined
  const frame = frames.find((item) => item.id === route.device) ?? frames[0]
  const hints = issues.filter((item) => item.level === 'hint')
  const otherErrors = issues.filter((item) => item.level === 'error' && !item.placeholder)
  // Count beats, not beats × devices, for the device on screen.
  const beats = allBeats()
  const missing = beats.filter((beat) => !hasScreen(beat, frame))

  function go(next: Omit<Route, 'device'> & { device?: string }) {
    writeHash({ ...next, device: next.device ?? routeRef.current.device })
  }

  const onCamera = useCallback((next: Camera | null) => {
    camera.current = next
    if (next) for (const resolve of cameraWaiters.current.splice(0)) resolve(next)
  }, [])

  // The intro plays once, not again when the map remounts for a device or after Live.
  // Back from Live, the map opens on the beat you were on, not on the whole map.
  const returnTo = useRef<string | null>(null)
  useEffect(() => {
    if (route.view === 'map') intro.current = false
    returnTo.current = route.view === 'live' ? route.beatId : null
  }, [route.view, route.beatId])

  useEffect(() => {
    if (!PRESENT) return
    const onMap = (): Promise<Camera> => {
      if (routeRef.current.view === 'map' && camera.current) return Promise.resolve(camera.current)
      // From Live the panel stays closed, so the camera has the whole window.
      if (routeRef.current.view !== 'map') go({ view: 'map', beatId: null })
      return new Promise((resolve) => cameraWaiters.current.push(resolve))
    }
    window.flow = {
      focus: async (beatId, options) => (await onMap()).focus(beatId, options),
      fit: async (options) => (await onMap()).fit(options),
      async select(beatId) {
        go({ view: 'map', beatId })
        await painted()
      },
      async live(beatId) {
        const id = beatId ?? routeRef.current.beatId ?? firstBeat()?.id ?? null
        go({ view: 'live', beatId: id })
        await painted()
      },
      async device(id) {
        if (!frames.some((item) => item.id === id)) throw new Error(`flows.md has no device "${id}".`)
        // The map remounts for a new device. Drop the old camera so focus waits for the new one.
        if (id !== routeRef.current.device) camera.current = null
        go({ view: routeRef.current.view, beatId: routeRef.current.beatId, device: id })
        await painted()
      },
      ready: async () => (await onMap()).settled,
    }
    return () => {
      delete window.flow
    }
    // go reads routeRef, so the API never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      {PRESENT ? null : (
        <a className="skip" href={route.view === 'map' ? '#flow-map' : '#live-phone'}>
          Skip to {route.view === 'map' ? 'map' : 'phone'}
        </a>
      )}
      <div className={PRESENT ? 'app-shell is-present' : 'app-shell'}>
        {PRESENT ? null : (
        <TopBar
          name={product.name}
          view={route.view}
          frames={frames}
          frame={frame}
          beats={beats}
          missing={missing}
          errors={otherErrors}
          hints={hints}
          onView={(view) =>
            view === 'map'
              ? go({ view: 'map', beatId: route.beatId })
              : go({ view: 'live', beatId: selected?.id ?? firstBeat()?.id ?? null })
          }
          onDevice={(id) => go({ view: route.view, beatId: route.beatId, device: id })}
          onGoToBeat={(beatId) => go({ view: 'map', beatId })}
        />
        )}

        {route.view === 'map' ? (
          <div className={selected ? 'map-wrap' : 'map-wrap panel-closed'} id="flow-map">
            <FlowMap
              key={frame.id}
              selectedId={selected?.id ?? null}
              hidden={hiddenEdges}
              onToggleEdge={toggleEdge}
              present={PRESENT}
              intro={intro.current}
              startAt={returnTo.current}
              onCamera={PRESENT ? onCamera : undefined}
              onSelect={(beatId) => go({ view: 'map', beatId })}
              onClear={() => go({ view: 'map', beatId: null })}
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
