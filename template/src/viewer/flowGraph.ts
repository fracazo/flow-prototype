import { MarkerType, type Edge as FlowEdge, type Node } from '@xyflow/react'
import { EDGE_TYPES, type Beat, type EdgeType, type Product } from '../content/parseFlows.ts'
import { mapScale, type DeviceFrame } from '../device/devices.ts'

// The map is a grid. Each flow is a lane: a channel on top for edges, then the
// row of screens, then their captions. Columns line up across lanes, so the gaps
// between columns are free all the way down and edges can run through them.
const GUTTER = 216
const COL_GAP = 88
const CHANNEL = 128
const CAPTION = 48
/** Edges leave a beat from the top. Each type has its own spot, so they fan out. */
const PORT_STEP = 0.12
const TRACK_STEP = 10
const TRACKS = 8
const CORRIDOR_STEP = 8
const CORRIDORS = 9

export type Point = [number, number]

export type BeatNodeData = {
  beat: Beat
  flowIndex: number
  unhappy: boolean
  dimmed: boolean
  selected: boolean
}

export type Lane = {
  flowId: string
  name: string
  flowIndex: number
  top: number
  height: number
  /** Row of screens: top edge and the x where the last one ends. */
  nodeTop: number
  right: number
}

export type MapLayout = {
  nodes: Node[]
  edges: FlowEdge[]
  lanes: Lane[]
  /** Left edge of the first column. Lane labels sit to its left at rest. */
  gutter: number
  width: number
}

export function isUnhappyGap(_beat: Beat) {
  return false
}

const LANE: Record<EdgeType, number> = {
  happy: 0,
  branch: 1,
  refusal: 2,
  back: 3,
  sheet: 4,
  inline: 5,
}

const DASH: Record<EdgeType, string | undefined> = {
  happy: undefined,
  branch: '7 5',
  refusal: '7 5',
  back: '2 5',
  sheet: '2 5',
  inline: '7 5',
}

export function edgeDash(type: EdgeType) {
  return DASH[type]
}

type Slot = { row: number; col: number }

type Pending = {
  id: string
  source: Beat
  target: Beat
  type: EdgeType
  from: Slot
  to: Slot
}

export function buildGraph(product: Product, frame: DeviceFrame): MapLayout {
  const nodes: Node[] = []
  const lanes: Lane[] = []
  const pending: Pending[] = []

  const scale = mapScale(frame)
  const phoneW = Math.round(frame.width * scale)
  const phoneH = Math.round(frame.height * scale)
  const nodeW = Math.max(phoneW, 176)
  const pitch = CHANNEL + phoneH + CAPTION
  const colX = (col: number) => GUTTER + col * (nodeW + COL_GAP)
  const nodeTop = (row: number) => row * pitch + CHANNEL

  const slots = new Map<string, Slot>()
  product.flows.forEach((flow, row) => flow.beats.forEach((beat, col) => slots.set(beat.id, { row, col })))
  const columns = Math.max(1, ...product.flows.map((flow) => flow.beats.length))

  product.flows.forEach((flow, row) => {
    lanes.push({
      flowId: flow.id,
      name: flow.name,
      flowIndex: row,
      top: row * pitch,
      height: pitch,
      nodeTop: nodeTop(row),
      right: colX(Math.max(0, flow.beats.length - 1)) + nodeW,
    })

    flow.beats.forEach((beat, col) => {
      nodes.push({
        id: beat.id,
        type: 'beat',
        position: { x: colX(col), y: nodeTop(row) },
        data: {
          beat,
          flowIndex: row,
          unhappy: isUnhappyGap(beat),
          dimmed: false,
          selected: false,
        } satisfies BeatNodeData,
        draggable: false,
        ariaLabel: `${beat.id} ${beat.title}. ${beat.why}`,
        style: { width: nodeW },
      })

      for (const edge of beat.edges) {
        const to = slots.get(edge.target)
        const target = to && product.flows[to.row].beats[to.col]
        if (!to || !target) continue
        pending.push({ id: `${beat.id}-${edge.type}-${edge.target}`, source: beat, target, type: edge.type, from: { row, col }, to })
      }
    })
  })

  // Short edges take the tracks nearest the screens, so longer ones arc over them
  // instead of crossing them.
  const span = (item: Pending) => Math.abs(item.to.col - item.from.col) + Math.abs(item.to.row - item.from.row) * columns
  pending.sort((a, b) => span(a) - span(b) || LANE[a.type] - LANE[b.type])

  const used = new Map<string, number>()
  const take = (key: string, limit: number) => {
    const count = used.get(key) ?? 0
    used.set(key, count + 1)
    return count % limit
  }
  const track = (row: number) => nodeTop(row) - 18 - take(`row-${row}`, TRACKS) * TRACK_STEP
  const corridor = (col: number) => {
    const k = take(`col-${col}`, CORRIDORS)
    const offset = Math.ceil(k / 2) * CORRIDOR_STEP * (k % 2 ? 1 : -1)
    return colX(col) - COL_GAP / 2 + offset
  }
  const port = (slot: Slot, type: EdgeType, incoming: boolean): Point => [
    colX(slot.col) + phoneW * (0.14 + LANE[type] * PORT_STEP + (incoming ? 0.06 : 0)),
    nodeTop(slot.row),
  ]

  const edges: FlowEdge[] = pending.map((item) => {
    const { from, to, type } = item
    let points: Point[]
    if (type === 'happy' && from.row === to.row && to.col === from.col + 1) {
      // Next step along the row: a straight line between the screens' sides.
      const y = nodeTop(from.row) + phoneH / 2
      points = [
        [colX(from.col) + phoneW, y],
        [colX(to.col), y],
      ]
    } else if (from.row === to.row) {
      const start = port(from, type, false)
      const end = port(to, type, true)
      const y = track(from.row)
      points = [start, [start[0], y], [end[0], y], end]
    } else {
      // Up into this lane's channel, along it to the gap left of the target's
      // column, down or up that gap to the target lane's channel, then in.
      const start = port(from, type, false)
      const end = port(to, type, true)
      const ys = track(from.row)
      const yt = track(to.row)
      const x = corridor(to.col)
      points = [start, [start[0], ys], [x, ys], [x, yt], [end[0], yt], end]
    }
    return {
      id: item.id,
      source: item.source.id,
      target: item.target.id,
      type: 'lane',
      className: `edge-${type}`,
      data: { edgeType: type, points },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }
  })

  // Two empty corners, so fitting the map includes the gutter, the top lane's
  // channel and the last lane's captions, not just the screens.
  const width = colX(columns - 1) + nodeW
  for (const [id, x, y] of [
    ['bounds-start', 0, 0],
    ['bounds-end', width + 24, product.flows.length * pitch],
  ] as const) {
    nodes.push({ id, type: 'bounds', position: { x, y }, data: {}, selectable: false, focusable: false, draggable: false })
  }

  return { nodes, edges, lanes, gutter: GUTTER, width }
}

/** An orthogonal path through the points, with small rounded corners. */
export function roundedPath(points: Point[], radius = 8) {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    const [nx, ny] = points[i + 1]
    const inLen = Math.hypot(x - px, y - py)
    const outLen = Math.hypot(nx - x, ny - y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    if (r < 0.5) {
      d += ` L ${x},${y}`
      continue
    }
    const ax = x - ((x - px) / inLen) * r
    const ay = y - ((y - py) / inLen) * r
    const bx = x + ((nx - x) / outLen) * r
    const by = y + ((ny - y) / outLen) * r
    d += ` L ${ax},${ay} Q ${x},${y} ${bx},${by}`
  }
  const [lx, ly] = points[points.length - 1]
  return `${d} L ${lx},${ly}`
}

export { EDGE_TYPES }
