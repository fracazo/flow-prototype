// Captures every beat that has a `url:` in flows.md, at the device's screen size.
//
//   npm run capture                 every beat with a url
//   npm run capture -- 1.2 1.3      only these beats
//   npm run capture -- --device web only this device (default: every device in flows.md)
//   npm run capture -- --login      open a browser, sign in by hand, save the session
//
// Shots go to src/shots/<device>/<beat id>.png. The viewer picks them up on reload.
// A signed-in session is saved to capture-auth.json, which is gitignored.

import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { chromium, devices, type BrowserContextOptions } from 'playwright'
import { parseFlows, type Product } from '../src/content/parseFlows.ts'
import { captureSize, framesOf, type DeviceFrame } from '../src/device/devices.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const authFile = join(root, 'capture-auth.json')

function contextFor(frame: DeviceFrame): BrowserContextOptions {
  const viewport = captureSize(frame)
  const auth = existsSync(authFile) ? { storageState: authFile } : {}
  const mobile =
    frame.chrome === 'iphone'
      ? { userAgent: devices['iPhone 15'].userAgent, isMobile: true, hasTouch: true }
      : frame.chrome === 'android'
        ? { userAgent: devices['Pixel 7'].userAgent, isMobile: true, hasTouch: true }
        : {}
  return { viewport, deviceScaleFactor: 2, reducedMotion: 'reduce', ...mobile, ...auth }
}

function resolveUrl(url: string, product: Product) {
  if (/^https?:\/\//i.test(url)) return url
  return new URL(url, product.base.endsWith('/') ? product.base : `${product.base}/`).toString()
}

async function login(product: Product) {
  if (!product.base) throw new Error('flows.md needs a base: line to sign in.')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(product.base)
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  await prompt.question('Sign in in the browser window, then press Enter here. ')
  prompt.close()
  await context.storageState({ path: authFile })
  await browser.close()
  console.log(`Saved the session to ${authFile}.`)
}

async function main() {
  const args = process.argv.slice(2)
  const source = await readFile(join(root, 'flows.md'), 'utf8')
  const { product, issues } = parseFlows(source)

  for (const issue of issues) {
    if (issue.message.includes('url')) console.warn(`flows.md: ${issue.message}`)
  }

  if (args.includes('--login')) return login(product)

  const deviceFlag = args.indexOf('--device')
  const deviceId = deviceFlag >= 0 ? args[deviceFlag + 1] : undefined
  const beatIds = args.filter((arg, index) => !arg.startsWith('--') && (deviceFlag < 0 || index !== deviceFlag + 1))
  const only = new Set(beatIds)
  const beats = product.flows
    .flatMap((flow) => flow.beats)
    .filter((beat) => beat.url && (only.size === 0 || only.has(beat.id)))

  if (beats.length === 0) {
    console.log('No beat has a url: line. Add one per existing screen, then run this again.')
    return
  }

  const frames = framesOf(product.device).frames.filter((frame) => !deviceId || frame.id === deviceId)
  if (frames.length === 0) throw new Error(`flows.md has no device "${deviceId}".`)

  const browser = await chromium.launch()
  let failed = 0

  for (const frame of frames) {
    const context = await browser.newContext(contextFor(frame))
    const outDir = join(root, 'src', 'shots', frame.id)
    await mkdir(outDir, { recursive: true })

    for (const beat of beats) {
      const url = resolveUrl(beat.url, product)
      const file = join(outDir, beat.image || `${beat.id}.png`)
      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
        await page.waitForTimeout(300)
        await page.screenshot({ path: file, animations: 'disabled' })
        const landed = page.url()
        const moved = new URL(landed).pathname !== new URL(url).pathname
        console.log(`${frame.id}  ${beat.id}  ${url}${moved ? `  (redirected to ${landed}: signed out? try --login)` : ''}`)
      } catch (error) {
        failed += 1
        console.error(`${frame.id}  ${beat.id}  ${url}  failed: ${(error as Error).message.split('\n')[0]}`)
      } finally {
        await page.close()
      }
    }

    await context.close()
  }

  await browser.close()
  const total = beats.length * frames.length
  console.log(`${total - failed} of ${total} captured, in src/shots/<device>/.`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
