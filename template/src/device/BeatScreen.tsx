import type { Beat, Edge } from '../content/parseFlows.ts'
import { screens } from '../screens/index.ts'
import { shotFor, thumbFor } from '../shots/shots.ts'
import type { DeviceFrame } from './devices.ts'
import { PlaceholderScreen } from './PlaceholderScreen.tsx'
import { ScreenshotScreen } from './ScreenshotScreen.tsx'

type BeatScreenProps = {
  beat: Beat
  frame: DeviceFrame
  interactive?: boolean
  onFollow?: (edge: Edge) => void
  /** Set in the map: the width the screen is drawn at, so screenshots use their thumbnail. */
  thumbnail?: number
}

/** A hand-built screen wins, then a screenshot, then the grey placeholder. */
export function BeatScreen({ thumbnail, ...props }: BeatScreenProps) {
  const Screen = screens[props.beat.id]
  if (Screen) return <Screen {...props} />
  const src = thumbnail ? thumbFor(props.beat, props.frame.id) : shotFor(props.beat, props.frame.id)
  if (src) return <ScreenshotScreen {...props} src={src} drawnWidth={thumbnail} />
  return <PlaceholderScreen {...props} />
}
