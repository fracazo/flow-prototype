import type { ComponentType } from 'react'
import type { Beat, Edge } from '../content/parseFlows.ts'

export type ScreenProps = {
  beat: Beat
  interactive?: boolean
  onFollow?: (edge: Edge) => void
}

export const screens: Record<string, ComponentType<ScreenProps>> = {}
