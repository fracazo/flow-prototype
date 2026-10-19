import type { ScreenProps } from '../screens/index.ts'
import { go } from '../screens/go.ts'

type ScreenshotScreenProps = ScreenProps & {
  src: string
  /** In the map: the CSS width the image ends up drawn at. */
  drawnWidth?: number
}

const warned = new Set<string>()

/** A map image far larger than its node costs memory and repaints on every zoom. */
function checkSize(image: HTMLImageElement, drawnWidth: number | undefined) {
  if (!drawnWidth || warned.has(image.src)) return
  if (image.naturalWidth > drawnWidth * 4) {
    warned.add(image.src)
    console.warn(
      `Map draws ${image.src} (${image.naturalWidth}px wide) at ${Math.round(drawnWidth)}px. Run npm run capture -- --thumbs.`,
    )
  }
}

/** A captured page. It sits below the frame's status bar, unless the image already has one (bleed). */
export function ScreenshotScreen({ beat, frame, src, drawnWidth, interactive = false, onFollow }: ScreenshotScreenProps) {
  const happy = beat.edges.find((edge) => edge.type === 'happy')
  const inset = beat.bleed ? { top: 0, bottom: 0 } : frame.inset

  return (
    <div
      className={beat.bleed ? 'shot shot-bleed' : 'shot tone-light'}
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
    >
      <img
        src={src}
        alt={`${beat.id} ${beat.title}`}
        draggable={false}
        decoding="async"
        onLoad={(event) => checkSize(event.currentTarget, drawnWidth)}
      />
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
