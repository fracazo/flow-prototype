import markdown from '../../flows.md?raw'
import { framesOf, type DeviceFrame } from '../device/devices.ts'
import { screens } from '../screens/index.ts'
import { shotFor } from '../shots/shots.ts'
import { parseFlows, type Beat, type ScreenSource } from './parseFlows.ts'

function screenOf(beat: Beat, frame: DeviceFrame): ScreenSource {
  if (screens[beat.id]) return 'component'
  if (shotFor(beat, frame.id)) return 'shot'
  return 'none'
}

export const prototype = parseFlows(markdown, screenOf)

/** Every device the product names. The first is the default. */
export const frames = framesOf(prototype.product.device).frames
