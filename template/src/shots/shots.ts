import type { Beat } from '../content/parseFlows.ts'

// Screenshots live in src/shots/<device>/<beat id>.png. `npm run capture` writes them.
// A file directly in src/shots/ is used for every device.
const files = import.meta.glob<string>('./**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function shotFor(beat: Beat, deviceId: string): string | undefined {
  const name = beat.image || `${beat.id}.png`
  return files[`./${deviceId}/${name}`] ?? files[`./${name}`]
}
