import type { Beat, Edge } from '../content/parseFlows.ts'
import { prototype } from '../content/prototype.ts'
import { frameOf } from './devices.ts'
import { PhoneFrame } from './PhoneFrame.tsx'
import { BeatScreen } from './BeatScreen.tsx'

type ScaledPhoneProps = {
  beat: Beat
  scale: number
  interactive?: boolean
  onFollow?: (edge: Edge) => void
  landmark?: boolean
}

export function ScaledPhone({ beat, scale, interactive = false, onFollow, landmark = false }: ScaledPhoneProps) {
  const frame = frameOf(prototype.product.device).frame

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
          <BeatScreen beat={beat} frame={frame} interactive={interactive} onFollow={onFollow} />
        </PhoneFrame>
      </div>
    </div>
  )
}
