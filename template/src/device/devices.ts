export type Chrome = 'iphone' | 'android' | 'web' | 'watch' | 'tv' | 'plain'

export type DeviceFrame = {
  id: string
  label: string
  width: number
  height: number
  radius: number
  chrome: Chrome
}

const PRESETS: Record<string, DeviceFrame> = {
  iphone: { id: 'iphone', label: 'iPhone', width: 393, height: 852, radius: 48, chrome: 'iphone' },
  android: { id: 'android', label: 'Android', width: 412, height: 915, radius: 36, chrome: 'android' },
  web: { id: 'web', label: 'Web', width: 1280, height: 800, radius: 12, chrome: 'web' },
  watch: { id: 'watch', label: 'Watch', width: 198, height: 242, radius: 54, chrome: 'watch' },
  tv: { id: 'tv', label: 'TV', width: 1920, height: 1080, radius: 16, chrome: 'tv' },
}

export function frameOf(value?: string): { frame: DeviceFrame; error?: string } {
  const raw = (value || 'iphone').trim()
  const key = raw.toLowerCase()
  const preset = PRESETS[key]
  if (preset) return { frame: preset }

  const size = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(key)
  if (size) {
    const width = Number(size[1])
    const height = Number(size[2])
    if (width >= 80 && height >= 80 && width <= 4000 && height <= 4000) {
      return {
        frame: {
          id: `${width}x${height}`,
          label: `${width}×${height}`,
          width,
          height,
          radius: Math.min(24, Math.round(Math.min(width, height) * 0.04)),
          chrome: 'plain',
        },
      }
    }
  }

  return {
    frame: PRESETS.iphone,
    error: `Unknown device "${raw}". Use iphone, android, web, watch, tv, or a size like 1024x640.`,
  }
}

/** Fit any frame into the map at about the same visual size as an iPhone. */
export function mapScale(frame: DeviceFrame) {
  return Math.min(1, 200 / frame.width, 392 / frame.height)
}
