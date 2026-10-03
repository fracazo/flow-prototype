import type { Beat, Edge, EdgeType } from '../content/parseFlows.ts'

function has(beat: Beat, type: EdgeType) {
  return beat.edges.some((edge) => edge.type === type)
}

export function edgeLabel(edge: Edge, beat: Beat) {
  const { copy } = beat
  if (edge.type === 'happy' && copy.primary) return copy.primary
  if (edge.type === 'sheet' && copy.secondary) return copy.secondary
  if (edge.type === 'branch' && copy.secondary && !has(beat, 'sheet')) return copy.secondary
  if (edge.type === 'back' && copy.back) return copy.back
  if (edge.type === 'back' && copy.secondary && !has(beat, 'sheet') && !has(beat, 'branch')) {
    return copy.secondary
  }
  if (edge.type === 'back') return 'Back'
  return edge.type
}
