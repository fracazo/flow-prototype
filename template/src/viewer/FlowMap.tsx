import { useMemo, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  type Edge as FlowEdge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { EDGE_TYPES, type Beat, type EdgeType } from '../content/parseFlows.ts'
import { BeatNode, FlowLabelNode } from './BeatNode.tsx'
import { LaneEdge } from './LaneEdge.tsx'
import { buildGraph, edgeDash, type BeatNodeData } from './flowGraph.ts'
import { prototype } from '../content/parseFlows.ts'

const nodeTypes = { beat: BeatNode, flowLabel: FlowLabelNode }
const edgeTypes = { lane: LaneEdge }

type FlowMapProps = {
  selectedId: string | null
  onSelect: (beatId: string) => void
  onOpenLive: (beatId: string) => void
}

function readEdgeColors() {
  const style = getComputedStyle(document.documentElement)
  const colors = {} as Record<EdgeType, string>
  for (const type of EDGE_TYPES) colors[type] = style.getPropertyValue(`--edge-${type}`).trim()
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

export function FlowMap({ selectedId, onSelect, onOpenLive }: FlowMapProps) {
  const beats = useMemo(() => prototype.product.flows.flatMap((flow) => flow.beats), [])
  const graph = useMemo(() => buildGraph(prototype.product), [])
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<EdgeType>>(() => new Set())
  const colors = useMemo(() => readEdgeColors(), [])

  const nodes = useMemo<Node[]>(() => {
    const focus = hoverId ? relatedIds(hoverId, beats) : null
    return graph.nodes.map((node) => {
      if (node.type !== 'beat') return node
      const data = node.data as BeatNodeData
      const dimmed = focus ? !focus.has(node.id) : false
      return {
        ...node,
        zIndex: node.id === hoverId || node.id === selectedId ? 10 : 0,
        data: { ...data, dimmed, selected: node.id === selectedId },
      }
    })
  }, [graph.nodes, hoverId, selectedId, beats])

  const edges = useMemo<FlowEdge[]>(() => {
    const focus = hoverId ? relatedIds(hoverId, beats) : null
    return graph.edges.flatMap((edge) => {
      const edgeType = edge.data?.edgeType as EdgeType
      if (hidden.has(edgeType)) return []
      const linked = !focus || focus.has(edge.source) || focus.has(edge.target)
      const color = colors?.[edgeType] ?? 'var(--edge-happy)'
      return [
        {
          ...edge,
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
  }, [graph.edges, hidden, hoverId, beats, colors])

  function toggle(type: EdgeType) {
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="map-canvas">
      <div className="legend" role="group" aria-label="Edge types">
        {EDGE_TYPES.map((type) => {
          const on = !hidden.has(type)
          return (
            <button
              key={type}
              type="button"
              className={on ? 'legend-item' : 'legend-item is-off'}
              aria-pressed={on}
              onClick={() => toggle(type)}
            >
              <span className={`legend-swatch swatch-${type}`} aria-hidden="true" />
              {type}
            </button>
          )
        })}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        panOnScroll
        onNodeClick={(_, node) => {
          if (node.type === 'beat') onSelect(node.id)
        }}
        onNodeDoubleClick={(_, node) => {
          if (node.type === 'beat') onOpenLive(node.id)
        }}
        onNodeMouseEnter={(_, node) => {
          if (node.type === 'beat') setHoverId(node.id)
        }}
        onNodeMouseLeave={() => setHoverId(null)}
      >
        <Background gap={22} size={1} color="#24282e" />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
