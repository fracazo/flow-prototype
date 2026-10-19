import type { ComponentType } from 'react'
import type { Beat, Edge } from '../content/parseFlows.ts'
import type { DeviceFrame } from '../device/devices.ts'

export type ScreenProps = {
  beat: Beat
  /** The device this screen is drawn on. Read its width and height, never hardcode them. */
  frame: DeviceFrame
  interactive?: boolean
  onFollow?: (edge: Edge) => void
}

export const screens: Record<string, ComponentType<ScreenProps>> = {}
