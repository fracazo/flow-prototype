import type { Beat, Edge } from '../content/parseFlows.ts'
import { prototype } from '../content/parseFlows.ts'
import { screens } from '../screens/index.ts'
import { frameOf } from './devices.ts'
import { PhoneFrame } from './PhoneFrame.tsx'
import { PlaceholderScreen } from './PlaceholderScreen.tsx'

type ScaledPhoneProps = {
  beat: Beat
  scale: number
  interactive?: boolean
  onFollow?: (edge: Edge) => void
  landmark?: boolean
}

export function ScaledPhone({ beat, scale, interactive = false, onFollow, landmark = false }: ScaledPhoneProps) {
  const Screen = screens[beat.id] ?? PlaceholderScreen
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
          <Screen beat={beat} interactive={interactive} onFollow={onFollow} />
        </PhoneFrame>
      </div>
    </div>
  )
}
