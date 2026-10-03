import type { Beat, Edge } from '../content/parseFlows.ts'
import { screens } from '../screens/index.ts'
import { PhoneFrame } from './PhoneFrame.tsx'
import { PlaceholderScreen } from './PlaceholderScreen.tsx'
import { PHONE_W, phoneHeight } from './phoneSize.ts'

type ScaledPhoneProps = {
  beat: Beat
  scale: number
  interactive?: boolean
  onFollow?: (edge: Edge) => void
  landmark?: boolean
}

export function ScaledPhone({ beat, scale, interactive = false, onFollow, landmark = false }: ScaledPhoneProps) {
  const Screen = screens[beat.id] ?? PlaceholderScreen
  const height = phoneHeight(beat.id)

  return (
    <div className="scaled-phone" style={{ width: PHONE_W * scale, height: height * scale }}>
      <div className="scaled-phone-inner" style={{ height, transform: `scale(${scale})` }}>
        <PhoneFrame
          label={`${beat.id} ${beat.title}`}
          className={scale < 0.9 ? 'phone-in-map' : undefined}
          landmark={landmark}
          height={height}
        >
          <Screen beat={beat} interactive={interactive} onFollow={onFollow} />
        </PhoneFrame>
      </div>
    </div>
  )
}
