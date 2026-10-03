import { MarkerType, type Edge as FlowEdge, type Node } from '@xyflow/react'
import { EDGE_TYPES, type Beat, type EdgeType, type Product } from '../content/parseFlows.ts'
import { frameOf, mapScale } from '../device/devices.ts'

const NODE_W = 230
const COL_GAP = 88
const ROW_GAP = 120
const LABEL_OFFSET = 168

export type BeatNodeData = {
  beat: Beat
  flowIndex: number
  unhappy: boolean
  dimmed: boolean
  selected: boolean
}

export type FlowLabelData = {
  flowId: string
  name: string
  summary: string
  flowIndex: number
}

export function isUnhappyGap(_beat: Beat) {
  return false
}

const HANDLE_LEFT: Record<EdgeType, string> = {
  happy: '18%',
  branch: '32%',
  refusal: '46%',
  back: '60%',
  sheet: '74%',
  inline: '88%',
}

const LANE: Record<EdgeType, number> = {
  happy: 0,
  branch: 1,
  refusal: 2,
  back: 3,
  sheet: 4,
  inline: 5,
}

export function handleLeft(type: EdgeType) {
  return HANDLE_LEFT[type]
}

export function edgeLane(type: EdgeType) {
  return LANE[type]
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

export function buildGraph(product: Product): { nodes: Node[]; edges: FlowEdge[] } {
  const nodes: Node[] = []
  const edges: FlowEdge[] = []

  const frame = frameOf(product.device).frame
  const scale = mapScale(frame)
  const nodeW = Math.max(NODE_W, Math.ceil(frame.width * scale) + 24)
  const rowPitch = frame.height * scale + LABEL_OFFSET + ROW_GAP

  product.flows.forEach((flow, flowIndex) => {
    const rowY = flowIndex * rowPitch

    nodes.push({
      id: `flow-${flow.id}`,
      type: 'flowLabel',
      position: { x: 0, y: rowY },
      data: {
        flowId: flow.id,
        name: flow.name,
        summary: flow.summary,
        flowIndex,
      } satisfies FlowLabelData,
      draggable: false,
      selectable: false,
      focusable: false,
    })

    flow.beats.forEach((beat, beatIndex) => {
      nodes.push({
        id: beat.id,
        type: 'beat',
        position: { x: beatIndex * (nodeW + COL_GAP), y: rowY + LABEL_OFFSET },
        data: {
          beat,
          flowIndex,
          unhappy: isUnhappyGap(beat),
          dimmed: false,
          selected: false,
        } satisfies BeatNodeData,
        draggable: false,
        ariaLabel: `${beat.id} ${beat.title}. ${beat.why}`,
        style: { width: nodeW },
      })

      for (const edge of beat.edges) {
        edges.push({
          id: `${beat.id}-${edge.type}-${edge.target}`,
          source: beat.id,
          target: edge.target,
          sourceHandle: `out-${edge.type}`,
          targetHandle: `in-${edge.type}`,
          type: 'lane',
          className: `edge-${edge.type}`,
          data: { edgeType: edge.type, lane: edgeLane(edge.type) },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        })
      }
    })
  })

  return { nodes, edges }
}

export { EDGE_TYPES }
