// Records a demo video of the viewer: 1920×1080 at 60fps, every frame evenly spaced.
//
//   npm run dev                       in one terminal
//   npm run record                    in another: writes demo.mp4
//   npm run record -- --draft         1x frames, faster, for checking the timing
//   npm run record -- --4k            keep 3840×2160 instead of scaling down to 1080p
//   npm run record -- --url http://localhost:5174 --out hero.mp4
//   npm run record -- --frames frames  also save every frame as a PNG, for a video editor
//
// Time in the page is frozen. Each frame moves it on by exactly 1/60 s, then
// takes a screenshot, so the video is smooth however slow the machine is. A 20
// second video takes a few minutes to render. Needs ffmpeg on the PATH.
//
// Edit scene() below to change what the camera does. See "Recording a demo" in SKILL.md.

import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import { parseFlows, type Product } from '../src/content/parseFlows.ts'
import { framesOf } from '../src/device/devices.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FPS = 60
const FRAME_MS = 1000 / FPS

type Shot = {
  /** Keep recording for this long. */
  hold: (ms: number) => Promise<void>
  /** Run something in the page without waiting for it. The camera moves while frames are taken. */
  run: (script: string) => Promise<void>
  key: (key: string) => Promise<void>
}

/** The demo. Beat and device ids come from flows.md, so it runs on any prototype. */
async function scene({ hold, run, key }: Shot, product: Product) {
  const flow = product.flows[0]
  const beat = flow.beats[Math.min(1, flow.beats.length - 1)]
  const devices = framesOf(product.device).frames
  const other = devices[1]?.id

  await hold(2400) // the intro builds the map, row by row
  await run(`flow.focus('${flow.beats[0].id}', { zoom: 0.9, duration: 1400 })`)
  await hold(1900)
  await run(`flow.select('${beat.id}')`)
  await hold(300)
  await run(`flow.focus('${beat.id}', { zoom: 1.1, duration: 900 })`)
  await hold(1800)
  await run(`flow.live('${beat.id}')`)
  await hold(1200)
  for (let step = 0; step < 5; step++) {
    await key('ArrowRight')
    await hold(900)
  }
  if (other) {
    await run(`flow.device('${other}')`)
    await hold(1500)
  }
  // From Live, fit opens the map on the current beat, then pulls back to the whole map.
  await run(`flow.fit({ duration: 1800 })`)
  await hold(2800)
}

// Web Animations do not follow Playwright's clock. Pause every CSS animation and
// transition, and set its time from a virtual clock that moves one frame per step.
const ANIMATION_CLOCK = `
  window.__frame = { now: 0, start: new WeakMap() }
  window.__step = (ms) => {
    const clock = window.__frame
    for (const animation of document.getAnimations()) {
      if (!clock.start.has(animation)) clock.start.set(animation, clock.now)
      animation.pause()
      animation.currentTime = clock.now + ms - clock.start.get(animation)
    }
    clock.now += ms
  }
`

function option(args: string[], name: string, fallback: string) {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

async function main() {
  const args = process.argv.slice(2)
  const url = option(args, '--url', 'http://localhost:5173')
  const out = option(args, '--out', 'demo.mp4')
  const scale = args.includes('--draft') ? 1 : 2
  const keep4k = args.includes('--4k') && scale === 2
  const framesDir = option(args, '--frames', '')
  if (framesDir) await mkdir(framesDir, { recursive: true })

  if (spawnSync('ffmpeg', ['-version']).error) throw new Error('ffmpeg is not installed. On a Mac: brew install ffmpeg')
  try {
    await fetch(url, { signal: AbortSignal.timeout(5000) })
  } catch {
    throw new Error(`Nothing answers at ${url}. Start the viewer with npm run dev, or pass --url.`)
  }

  const { product } = parseFlows(await readFile(join(root, 'flows.md'), 'utf8'))
  const browser = await chromium.launch()
  const page: Page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale })
  page.on('pageerror', (error) => console.error(`page: ${error.message}`))

  // install() alone lets time run on. Pause it, so only frame() moves it.
  await page.clock.install({ time: 0 })
  await page.clock.pauseAt(1000)
  await page.addInitScript(ANIMATION_CLOCK)
  await page.goto(`${url}/#/map?present&intro`)
  await page.waitForFunction("'flow' in window")

  const ffmpeg = spawn(
    'ffmpeg',
    [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      ...(scale === 2 && !keep4k ? ['-vf', 'scale=1920:1080:flags=lanczos'] : []),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      out,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )
  const done = new Promise<void>((resolve, reject) =>
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)))),
  )

  let frames = 0
  const frame = async () => {
    await page.clock.runFor(FRAME_MS)
    await page.evaluate(`window.__step(${FRAME_MS})`)
    const png = await page.screenshot({ type: 'png' })
    if (framesDir) await writeFile(join(framesDir, `${String(frames).padStart(5, '0')}.png`), png)
    if (!ffmpeg.stdin.write(png)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve))
    frames += 1
    if (frames % FPS === 0) process.stdout.write(`\r${frames / FPS}s recorded`)
  }

  const shot: Shot = {
    async hold(ms) {
      for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) await frame()
    },
    async run(script) {
      await page.evaluate(`void (${script})`)
    },
    async key(name) {
      await page.keyboard.press(name)
    },
  }

  await scene(shot, product)
  ffmpeg.stdin.end()
  await done
  await browser.close()
  process.stdout.write('\n')
  console.log(`Wrote ${out}: ${frames} frames, ${(frames / FPS).toFixed(1)}s at ${FPS}fps.`)
}

main().catch((error: unknown) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
