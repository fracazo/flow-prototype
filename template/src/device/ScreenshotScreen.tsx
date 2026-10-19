import type { ScreenProps } from '../screens/index.ts'
import { go } from '../screens/go.ts'

type ScreenshotScreenProps = ScreenProps & { src: string }

/** A captured page. It sits below the frame's status bar, unless the image already has one (bleed). */
export function ScreenshotScreen({ beat, frame, src, interactive = false, onFollow }: ScreenshotScreenProps) {
  const happy = beat.edges.find((edge) => edge.type === 'happy')
  const inset = beat.bleed ? { top: 0, bottom: 0 } : frame.inset

  return (
    <div
      className={beat.bleed ? 'shot shot-bleed' : 'shot tone-light'}
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
    >
      <img src={src} alt={`${beat.id} ${beat.title}`} draggable={false} />
      {interactive && happy ? (
        <button
          type="button"
          className="shot-hit"
          aria-label={`Continue to ${happy.target}`}
          onClick={() => go(beat, 'happy', onFollow)}
        />
      ) : null}
    </div>
  )
}
