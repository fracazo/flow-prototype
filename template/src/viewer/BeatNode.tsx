import { memo, type CSSProperties } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { useFrame } from '../device/DeviceContext.ts'
import { mapScale } from '../device/devices.ts'
import { ScaledPhone } from '../device/ScaledPhone.tsx'
import type { BeatNodeData } from './flowGraph.ts'

type BeatNodeProps = NodeProps<Node<BeatNodeData, 'beat'>>

// The map rebuilds node data on every selection. Only re-render a node, and the
// whole screen inside it, when something it draws has changed.
function sameNode(a: BeatNodeProps, b: BeatNodeProps) {
  return (
    a.data.beat === b.data.beat &&
    a.data.flowIndex === b.data.flowIndex &&
    a.data.unhappy === b.data.unhappy &&
    a.data.dimmed === b.data.dimmed &&
    a.data.selected === b.data.selected
  )
}

export const BeatNode = memo(function BeatNode({ data }: BeatNodeProps) {
  const { beat, flowIndex, unhappy, dimmed, selected } = data
  const frame = useFrame()

  return (
    <div
      className={`beat-node flow-color-${flowIndex % 6}${dimmed ? ' is-dim' : ''}${selected ? ' is-selected' : ''}`}
      style={{ '--row': flowIndex } as CSSProperties}
    >
      {/* Edges are routed in flowGraph.ts. React Flow still needs a handle on each end. */}
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Top} isConnectable={false} />
      <div aria-hidden="true">
        <ScaledPhone beat={beat} scale={mapScale(frame)} thumbnail />
      </div>
      <div className="beat-node-caption">
        <span className="beat-node-id">{beat.id}</span>
        <span className="beat-node-title">{beat.title}</span>
        {unhappy ? (
          <span className="unhappy-dot">
            <span className="unhappy-mark" aria-hidden="true" />
            Gap
          </span>
        ) : null}
      </div>
    </div>
  )
}, sameNode)
