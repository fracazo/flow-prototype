import markdown from '../../flows.md?raw'
import { frameOf } from '../device/devices.ts'
import { screens } from '../screens/index.ts'
import { shotFor } from '../shots/shots.ts'
import { parseFlows, type Beat, type Product, type ScreenSource } from './parseFlows.ts'

function screenOf(beat: Beat, product: Product): ScreenSource {
  if (screens[beat.id]) return 'component'
  if (shotFor(beat, frameOf(product.device).frame.id)) return 'shot'
  return 'none'
}

export const prototype = parseFlows(markdown, screenOf)
