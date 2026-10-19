export type Chrome = 'iphone' | 'android' | 'web' | 'watch' | 'tv' | 'plain'

export type DeviceFrame = {
  id: string
  label: string
  width: number
  height: number
  radius: number
  chrome: Chrome
  /** Space the frame's own chrome covers at the top and bottom of the screen. */
  inset: { top: number; bottom: number }
}

/** Height of the browser bar drawn above a web screen. */
export const BROWSER_BAR = 44

const PRESETS: Record<string, DeviceFrame> = {
  iphone: { id: 'iphone', label: 'iPhone', width: 393, height: 852, radius: 48, chrome: 'iphone', inset: { top: 54, bottom: 34 } },
  android: { id: 'android', label: 'Android', width: 412, height: 915, radius: 36, chrome: 'android', inset: { top: 36, bottom: 24 } },
  web: { id: 'web', label: 'Web', width: 1280, height: 800, radius: 12, chrome: 'web', inset: { top: 0, bottom: 0 } },
  watch: { id: 'watch', label: 'Watch', width: 198, height: 242, radius: 54, chrome: 'watch', inset: { top: 0, bottom: 0 } },
  tv: { id: 'tv', label: 'TV', width: 1920, height: 1080, radius: 16, chrome: 'tv', inset: { top: 0, bottom: 0 } },
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
          inset: { top: 0, bottom: 0 },
        },
      }
    }
  }

  return {
    frame: PRESETS.iphone,
    error: `Unknown device "${raw}". Use iphone, android, web, watch, tv, or a size like 1024x640.`,
  }
}

/** `device: web, iphone` lists several. The first is the default. Duplicates are dropped. */
export function framesOf(value?: string): { frames: DeviceFrame[]; errors: string[] } {
  const frames: DeviceFrame[] = []
  const errors: string[] = []
  for (const part of (value || 'iphone').split(',')) {
    if (!part.trim()) continue
    const { frame, error } = frameOf(part)
    if (error) errors.push(error)
    else if (!frames.some((item) => item.id === frame.id)) frames.push(frame)
  }
  if (frames.length === 0) frames.push(PRESETS.iphone)
  return { frames, errors }
}

/** The page size a screenshot is captured at: the screen minus the frame's chrome. */
export function captureSize(frame: DeviceFrame) {
  const bar = frame.chrome === 'web' ? BROWSER_BAR : 0
  return { width: frame.width, height: frame.height - bar - frame.inset.top - frame.inset.bottom }
}

/** Fit any frame into the map at about the same visual size as an iPhone. */
export function mapScale(frame: DeviceFrame) {
  return Math.min(1, 200 / frame.width, 392 / frame.height)
}
