import type { Beat, Edge } from '../content/parseFlows.ts'
import { useFrame } from './DeviceContext.ts'
import { PhoneFrame } from './PhoneFrame.tsx'
import { BeatScreen } from './BeatScreen.tsx'

type ScaledPhoneProps = {
  beat: Beat
  scale: number
  interactive?: boolean
  onFollow?: (edge: Edge) => void
  landmark?: boolean
  /** Draw screenshots from their small thumbnail. For the map, where nodes are tiny. */
  thumbnail?: boolean
}

export function ScaledPhone({
  beat,
  scale,
  interactive = false,
  onFollow,
  landmark = false,
  thumbnail = false,
}: ScaledPhoneProps) {
  const frame = useFrame()

  return (
    <div className="scaled-phone" style={{ width: frame.width * scale, height: frame.height * scale }}>
      <div
        className="scaled-phone-inner"
        style={{ width: frame.width, height: frame.height, transform: `scale(${scale})` }}
      >
        <PhoneFrame
          frame={frame}
          label={`${beat.id} ${beat.title}`}
          className={scale < 0.9 ? 'phone-in-map' : undefined}
          landmark={landmark}
        >
          <BeatScreen
            beat={beat}
            frame={frame}
            interactive={interactive}
            onFollow={onFollow}
            thumbnail={thumbnail ? frame.width * scale : undefined}
          />
        </PhoneFrame>
      </div>
    </div>
  )
}
