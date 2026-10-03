import { BaseEdge, type EdgeProps } from '@xyflow/react'

export function LaneEdge({ sourceX, sourceY, targetX, targetY, style, markerEnd, data }: EdgeProps) {
  const lane = typeof data?.lane === 'number' ? data.lane : 0
  const lift = 26 + lane * 16
  const path = `M ${sourceX},${sourceY} C ${sourceX},${sourceY - lift} ${targetX},${targetY - lift} ${targetX},${targetY}`

  return <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={18} />
}
