import type { Beat } from '../content/parseFlows.ts'

export { THUMB_WIDTH } from './thumbs.ts'

// Screenshots live in src/shots/<device>/<beat id>.png. `npm run capture` writes them.
// A file directly in src/shots/ is used for every device.
// Map thumbnails sit next to them in a thumbs/ folder, THUMB_WIDTH pixels wide.
const files = import.meta.glob<string>('./**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function nameOf(beat: Beat) {
  return beat.image || `${beat.id}.png`
}

export function shotFor(beat: Beat, deviceId: string): string | undefined {
  const name = nameOf(beat)
  return files[`./${deviceId}/${name}`] ?? files[`./${name}`]
}

/** The map thumbnail, or the full shot when no thumbnail was made yet. */
export function thumbFor(beat: Beat, deviceId: string): string | undefined {
  const name = nameOf(beat)
  return (
    files[`./${deviceId}/thumbs/${name}`] ??
    files[`./${deviceId}/${name}`] ??
    files[`./thumbs/${name}`] ??
    files[`./${name}`]
  )
}
