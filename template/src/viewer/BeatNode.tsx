import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { prototype, EDGE_TYPES } from '../content/parseFlows.ts'
import { frameOf, mapScale } from '../device/devices.ts'
import { ScaledPhone } from '../device/ScaledPhone.tsx'
import { handleLeft, type BeatNodeData, type FlowLabelData } from './flowGraph.ts'

export function BeatNode({ data }: NodeProps<Node<BeatNodeData, 'beat'>>) {
  const { beat, flowIndex, unhappy, dimmed, selected } = data
  const frame = frameOf(prototype.product.device).frame

  return (
    <div className={`beat-node flow-color-${flowIndex % 6}${dimmed ? ' is-dim' : ''}${selected ? ' is-selected' : ''}`}>
      <div className="beat-node-body">
        {EDGE_TYPES.map((type) => (
          <Handle
            key={`in-${type}`}
            id={`in-${type}`}
            type="target"
            position={Position.Top}
            isConnectable={false}
            style={{ left: handleLeft(type) }}
          />
        ))}
        {EDGE_TYPES.map((type) => (
          <Handle
            key={`out-${type}`}
            id={`out-${type}`}
            type="source"
            position={Position.Top}
            isConnectable={false}
            style={{ left: handleLeft(type) }}
          />
        ))}
        <div aria-hidden="true">
          <ScaledPhone beat={beat} scale={mapScale(frame)} />
        </div>
      </div>
      <div className="beat-node-caption">
        <span className="flow-dot" aria-hidden="true" />
        <span className="beat-node-title">
          {beat.id} {beat.title}
        </span>
        {unhappy ? (
          <span className="unhappy-dot">
            <span className="unhappy-mark" aria-hidden="true" />
            Gap
          </span>
        ) : null}
      </div>
      <p className="beat-node-why">{beat.why}</p>
    </div>
  )
}

export function FlowLabelNode({ data }: NodeProps<Node<FlowLabelData, 'flowLabel'>>) {
  return (
    <div className={`flow-label flow-color-${data.flowIndex % 6}`}>
      <p className="flow-label-id">
        <span className="flow-dot" aria-hidden="true" />
        {data.flowId}
      </p>
      <h2>{data.name}</h2>
      <p>{data.summary}</p>
    </div>
  )
}
