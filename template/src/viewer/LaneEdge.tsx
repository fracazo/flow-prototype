import type { CSSProperties } from 'react'
import { BaseEdge, type EdgeProps } from '@xyflow/react'
import { roundedPath, type Point } from './flowGraph.ts'

function lengthOf(points: Point[]) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
  }
  return total
}

// The route is worked out for the whole map in buildGraph, so edges can share
// channels without overlapping. This only draws it.
export function LaneEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, data }: EdgeProps) {
  const points = (data?.points as Point[] | undefined) ?? [
    [sourceX, sourceY],
    [targetX, targetY],
  ]
  const path = roundedPath(points)
  if (!data?.intro) return <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={14} />

  // Build-in: a mask draws along the path, so dashed edges stay dashed and the
  // arrowhead arrives with the line.
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const x = Math.min(...xs) - 24
  const y = Math.min(...ys) - 24
  const maskId = `edge-draw-${id}`
  return (
    <>
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={x}
          y={y}
          width={Math.max(...xs) - x + 24}
          height={Math.max(...ys) - y + 24}
        >
          <path
            className="edge-draw"
            d={path}
            fill="none"
            stroke="#fff"
            strokeWidth={24}
            style={{ '--len': `${lengthOf(points) + 24}px` } as CSSProperties}
          />
        </mask>
      </defs>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ ...style, mask: `url(#${maskId})` }} interactionWidth={14} />
    </>
  )
}
