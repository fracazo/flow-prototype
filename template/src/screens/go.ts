import type { Beat, Edge, EdgeType } from '../content/parseFlows.ts'

export function go(beat: Beat, type: EdgeType, onFollow?: (edge: Edge) => void) {
  const edge = beat.edges.find((item) => item.type === type)
  if (edge) onFollow?.(edge)
}
