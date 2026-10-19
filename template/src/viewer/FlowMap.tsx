import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  Background,
  Panel,
  ReactFlow,
  useReactFlow,
  useStore,
  type Edge as FlowEdge,
  type Node,
} from '@xyflow/react'
import { Maximize, Minus, Plus } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { EDGE_TYPES, type Beat, type EdgeType } from '../content/parseFlows.ts'
import { BeatNode } from './BeatNode.tsx'
import { EdgeKey } from './EdgeKey.tsx'
import { LaneEdge } from './LaneEdge.tsx'
import { buildGraph, edgeDash, type BeatNodeData, type Lane } from './flowGraph.ts'
import { prototype } from '../content/prototype.ts'
import { useFrame } from '../device/DeviceContext.ts'
import { mapScale } from '../device/devices.ts'

const nodeTypes = { beat: BeatNode, bounds: BoundsNode }
const edgeTypes = { lane: LaneEdge }

/** Below this zoom a node shows only its id and title, drawn larger so it stays legible. */
const FAR_ZOOM = 0.5
/** Width of the beat panel, which covers the right of the map when a beat is selected. */
const PANEL_W = 360
const INTRO_ROW_MS = 140
const INTRO_EDGE_MS = 700

export type CameraOptions = {
  zoom?: number
  duration?: number
  ease?: (t: number) => number
  interpolate?: 'smooth' | 'linear'
}

export type Camera = {
  focus: (beatId: string, options?: CameraOptions) => Promise<boolean>
  fit: (options?: Omit<CameraOptions, 'zoom'> & { padding?: number }) => Promise<boolean>
  /** Resolves once the intro, if any, has finished. */
  settled: Promise<void>
}

type FlowMapProps = {
  selectedId: string | null
  hidden: ReadonlySet<EdgeType>
  onToggleEdge: (type: EdgeType) => void
  onSelect: (beatId: string) => void
  onClear: () => void
  onOpenLive: (beatId: string) => void
  /** Presentation mode: no key, no zoom controls, no attribution. */
  present?: boolean
  /** Build the map in, row by row, then draw the edges. */
  intro?: boolean
  onCamera?: (camera: Camera | null) => void
  /** Open centred on this beat at full size, instead of fitting the whole map. */
  startAt?: string | null
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function readEdgeColors() {
  const style = getComputedStyle(document.documentElement)
  const colors = {} as Record<EdgeType, string>
  for (const type of EDGE_TYPES) colors[type] = style.getPropertyValue(`--viewer-edge-${type}`).trim()
  return colors
}

function relatedIds(beatId: string, beats: Beat[]) {
  const ids = new Set<string>([beatId])
  for (const beat of beats) {
    for (const edge of beat.edges) {
      if (beat.id === beatId) ids.add(edge.target)
      if (edge.target === beatId) ids.add(beat.id)
    }
  }
  return ids
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function FlowMap({
  selectedId,
  hidden,
  onToggleEdge,
  onSelect,
  onClear,
  onOpenLive,
  present = false,
  intro = false,
  onCamera,
  startAt = null,
}: FlowMapProps) {
  const beats = useMemo(() => prototype.product.flows.flatMap((flow) => flow.beats), [])
  const frame = useFrame()
  const graph = useMemo(() => buildGraph(prototype.product, frame), [frame])
  const colors = useMemo(() => readEdgeColors(), [])
  const canvas = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(() => intro && !prefersReducedMotion())
  const [start] = useState(() => graph.nodes.find((node) => node.id === startAt) ?? null)
  const introMs = graph.lanes.length * INTRO_ROW_MS + 300 + INTRO_EDGE_MS

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setPlaying(false), introMs)
    return () => window.clearTimeout(timer)
  }, [playing, introMs])

  const nodes = useMemo<Node[]>(() => {
    // Focus follows the selection, not the pointer. Hover focus flashed the whole
    // map whenever a node slid under the cursor while zooming or panning.
    const focus = selectedId ? relatedIds(selectedId, beats) : null
    return graph.nodes.map((node) => {
      if (node.type !== 'beat') return node
      const data = node.data as BeatNodeData
      const dimmed = focus ? !focus.has(node.id) : false
      const selected = node.id === selectedId
      return { ...node, zIndex: selected ? 10 : 0, data: { ...data, dimmed, selected } }
    })
  }, [graph.nodes, selectedId, beats])

  const edges = useMemo<FlowEdge[]>(() => {
    const focus = selectedId ? relatedIds(selectedId, beats) : null
    return graph.edges.flatMap((edge) => {
      const edgeType = edge.data?.edgeType as EdgeType
      if (hidden.has(edgeType)) return []
      const linked = !focus || focus.has(edge.source) || focus.has(edge.target)
      const color = colors?.[edgeType] ?? 'var(--viewer-edge-happy)'
      return [
        {
          ...edge,
          data: playing ? { ...edge.data, intro: true } : edge.data,
          className: linked ? edge.className : `${edge.className} edge-dim`,
          style: {
            stroke: color,
            strokeWidth: 1.75,
            strokeDasharray: edgeDash(edgeType),
          },
          markerEnd: {
            type: 'arrowclosed' as const,
            width: 16,
            height: 16,
            color,
          },
        },
      ]
    })
  }, [graph.edges, hidden, selectedId, beats, colors, playing])

  const classes = ['map-canvas', present ? 'is-present' : '', playing ? 'is-intro' : ''].filter(Boolean).join(' ')

  return (
    <div className={classes} ref={canvas} style={{ '--intro-edges-at': `${graph.lanes.length * INTRO_ROW_MS + 300}ms` } as CSSProperties}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView={!start}
        fitViewOptions={{ padding: 0.08 }}
        onInit={(flow) => {
          if (!start) return
          const width = typeof start.style?.width === 'number' ? start.style.width : 0
          const height = frame.height * mapScale(frame)
          void flow.setCenter(start.position.x + width / 2, start.position.y + height / 2, { zoom: 1 })
        }}
        minZoom={0.15}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        panOnScroll
        proOptions={{ hideAttribution: present }}
        onNodeClick={(_, node) => {
          if (node.type === 'beat') onSelect(node.id)
        }}
        onNodeDoubleClick={(_, node) => {
          if (node.type === 'beat') onOpenLive(node.id)
        }}
        onPaneClick={onClear}
      >
        <MapLanes lanes={graph.lanes} canvas={canvas} />
        <Background gap={22} size={1} color="var(--viewer-dot)" bgColor="transparent" />
        {present ? null : (
          <Panel position="bottom-left" className="map-dock">
            <EdgeKey hidden={hidden} onToggle={onToggleEdge} />
            <ZoomControls />
          </Panel>
        )}
        {onCamera ? (
          <CameraBridge onCamera={onCamera} panelOpen={selectedId !== null} playing={playing} />
        ) : null}
      </ReactFlow>
    </div>
  )
}

/** An empty corner of the map. It only widens what fitView includes. */
function BoundsNode() {
  return <div className="map-bounds" />
}

/** Lane bands behind each flow, and its label pinned to the left edge of the window. */
function MapLanes({ lanes, canvas }: { lanes: Lane[]; canvas: RefObject<HTMLDivElement | null> }) {
  const [tx, ty, zoom] = useStore((state) => state.transform)
  const far = zoom < FAR_ZOOM

  // A CSS variable, not node data, so zooming never re-renders the nodes.
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    el.style.setProperty('--map-zoom', String(zoom))
    el.classList.toggle('is-far', far)
  }, [canvas, zoom, far])

  return (
    <>
      <div className="map-lanes" aria-hidden="true">
        {lanes.map((lane, index) => (
          <div
            key={lane.flowId}
            className={`map-lane${index % 2 === 0 ? ' is-even' : ''}`}
            style={{ top: ty + lane.top * zoom, height: lane.height * zoom, '--row': index } as CSSProperties}
          />
        ))}
      </div>
      <div className="map-lane-labels">
        {lanes.map((lane, index) => (
          <p
            key={lane.flowId}
            className={`map-lane-label flow-color-${lane.flowIndex % 6}${index % 2 === 0 ? ' is-even' : ''}`}
            style={
              {
                top: ty + (lane.top + 20) * zoom,
                left: Math.max(16, tx + 16 * zoom),
                '--row': index,
              } as CSSProperties
            }
          >
            <span className="map-lane-id">{lane.flowId}</span>
            {lane.name}
          </p>
        ))}
      </div>
    </>
  )
}

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  return (
    <div className="zoom-controls" role="group" aria-label="Zoom">
      <button type="button" className="dock-button" aria-label="Zoom in" onClick={() => zoomIn({ duration: 200 })}>
        <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button type="button" className="dock-button" aria-label="Zoom out" onClick={() => zoomOut({ duration: 200 })}>
        <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="dock-button"
        aria-label="Fit the whole map"
        onClick={() => fitView({ duration: 300, padding: 0.08 })}
      >
        <Maximize size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}

/** Hands App the scripted camera: focus a beat, or fit the map, with easing. */
function CameraBridge({
  onCamera,
  panelOpen,
  playing,
}: {
  onCamera: (camera: Camera | null) => void
  panelOpen: boolean
  playing: boolean
}) {
  const flow = useReactFlow()
  const panel = useRef(panelOpen)
  const initialized = useStore((state) => state.nodeLookup.size > 0 && [...state.nodeLookup.values()].every((n) => n.measured.width))
  const [intro] = useState(() => {
    let resolve = () => {}
    const settled = new Promise<void>((done) => (resolve = done))
    return { settled, resolve }
  })

  useEffect(() => {
    panel.current = panelOpen
  }, [panelOpen])

  useEffect(() => {
    if (!playing) intro.resolve()
  }, [playing, intro])

  useEffect(() => {
    if (!initialized) return
    onCamera({
      focus(beatId, { zoom = 1, duration = 900, ease = easeInOutCubic, interpolate } = {}) {
        const node = flow.getInternalNode(beatId)
        if (!node) return Promise.reject(new Error(`No beat ${beatId} on the map.`))
        const width = node.measured.width ?? 0
        const height = node.measured.height ?? 0
        // With the panel open, centre the beat in the part of the map still visible.
        const shift = panel.current ? PANEL_W / 2 / zoom : 0
        const x = node.internals.positionAbsolute.x + width / 2 + shift
        const y = node.internals.positionAbsolute.y + height / 2
        return flow.setCenter(x, y, { zoom, duration, ease, interpolate })
      },
      fit({ duration = 900, ease = easeInOutCubic, interpolate, padding = 0.08 } = {}) {
        return flow.fitView({ duration, ease, interpolate, padding })
      },
      settled: intro.settled,
    })
    return () => onCamera(null)
  }, [initialized, flow, onCamera, intro])

  return null
}
