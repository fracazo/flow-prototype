// Captures every beat that has a `url:` in flows.md, at the device's screen size.
//
//   npm run capture                 every beat with a url
//   npm run capture -- 1.2 1.3      only these beats
//   npm run capture -- --device web only this device (default: every device in flows.md)
//   npm run capture -- --login      open a browser, sign in by hand, save the session
//   npm run capture -- --thumbs     only remake map thumbnails, for every image in src/shots
//
// Shots go to src/shots/<device>/<beat id>.png, with a small copy in thumbs/ for the map.
// The viewer picks them up on reload.
// `hide:` selectors (product-wide, plus the beat's own) are set to display: none before each shot.
// A page that redirects somewhere else is reported and not saved: it is gated or mid-flow,
// so that beat needs image: or a hand-built screen. Capture stops early if base: is not up.
// A signed-in session is saved to capture-auth.json, which is gitignored.

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { chromium, devices, type Browser, type BrowserContextOptions } from 'playwright'
import { parseFlows, type Product } from '../src/content/parseFlows.ts'
import { captureSize, framesOf, type DeviceFrame } from '../src/device/devices.ts'
import { THUMB_WIDTH } from '../src/shots/thumbs.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const authFile = join(root, 'capture-auth.json')
const shotsDir = join(root, 'src', 'shots')
const IMAGE = /\.(png|jpe?g|webp)$/i
const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

/** Write a THUMB_WIDTH-wide copy of a shot to thumbs/ beside it, for the map. */
async function writeThumb(browser: Browser, file: string) {
  const out = join(dirname(file), 'thumbs', basename(file).replace(/\.webp$/i, '.png'))
  const data = (await readFile(file)).toString('base64')
  const page = await browser.newPage({ viewport: { width: THUMB_WIDTH, height: 100 }, deviceScaleFactor: 1 })
  try {
    const type = MIME[extname(file).toLowerCase()]
    await page.setContent(
      `<body style="margin:0"><img id="shot" style="display:block;width:${THUMB_WIDTH}px" src="data:${type};base64,${data}"></body>`,
    )
    // setContent waits for the load event, so the image is decoded by now.
    const image = page.locator('#shot')
    await mkdir(dirname(out), { recursive: true })
    await image.screenshot({ path: out })
  } finally {
    await page.close()
  }
}

/** Every image in src/shots, leaving out the thumbs folders. */
async function allShots(dir = shotsDir): Promise<string[]> {
  if (!existsSync(dir)) return []
  const found: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'thumbs') found.push(...(await allShots(path)))
    else if (entry.isFile() && IMAGE.test(entry.name)) found.push(path)
  }
  return found
}

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

/** Path and query, without a trailing slash, to tell a redirect from the page asked for. */
function pageOf(url: string) {
  const parsed = new URL(url)
  return `${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`
}

const SIGN_IN = /(sign-?in|log-?in|auth|session|sso|oauth)/i

/** Why a server could not be reached, or null when it answered with any status. */
async function unreachable(url: string): Promise<string | null> {
  try {
    await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(5_000) })
    return null
  } catch (error) {
    const cause = (error as { cause?: { code?: string; message?: string } }).cause
    if ((error as Error).name === 'TimeoutError') return 'no answer in 5s'
    if (cause?.code === 'ECONNREFUSED') return 'connection refused'
    if (cause?.code === 'ENOTFOUND') return 'host not found'
    return cause?.message ?? (error as Error).message
  }
}

/** One `display: none` rule per selector, so an invalid one drops only itself. */
function hideStyle(selectors: string[]) {
  return selectors.map((selector) => `${selector} { display: none !important; }`).join('\n')
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

  if (args.includes('--thumbs')) {
    const browser = await chromium.launch()
    const files = await allShots()
    for (const file of files) await writeThumb(browser, file)
    await browser.close()
    console.log(`Made ${files.length} map thumbnails.`)
    return
  }

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

  // Check each server answers before opening a browser, so a stopped dev server is one clear line.
  const servers = new Map<string, string>()
  for (const beat of beats) {
    if (/^https?:\/\//i.test(beat.url)) servers.set(new URL(beat.url).origin, new URL(beat.url).origin)
    else if (product.base) servers.set('base', product.base)
  }
  let down = false
  for (const [key, url] of servers) {
    const reason = await unreachable(url)
    if (!reason) continue
    down = true
    console.error(
      key === 'base'
        ? `Could not reach base: ${url} (${reason}). Start the product's dev server, or fix base: in flows.md.`
        : `Could not reach ${url} (${reason}). Check the url: lines that point there.`,
    )
  }
  if (down) {
    process.exitCode = 1
    return
  }

  // Selectors the browser cannot parse drop only their own rule; say so once at the end.
  const badSelectors = new Set<string>()

  const browser = await chromium.launch()
  let failed = 0
  let redirected = 0

  for (const frame of frames) {
    const context = await browser.newContext(contextFor(frame))
    const outDir = join(shotsDir, frame.id)
    await mkdir(outDir, { recursive: true })

    for (const beat of beats) {
      const url = resolveUrl(beat.url, product)
      const file = join(outDir, beat.image || `${beat.id}.png`)
      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
        await page.waitForTimeout(300)
        const landed = page.url()
        if (pageOf(landed) !== pageOf(url)) {
          redirected += 1
          const landedUrl = new URL(landed)
          const hint = SIGN_IN.test(landedUrl.pathname + landedUrl.search) ? ' (looks like sign-in: try --login)' : ''
          console.log(
            `${frame.id}  ${beat.id}  ${url}  redirected to ${landed}: gated or mid-flow, needs image: or a hand-built screen${hint}`,
          )
          continue
        }
        const hide = [...new Set([...product.hide, ...beat.hide])]
        if (hide.length > 0) {
          for (const selector of hide) {
            if (badSelectors.has(selector)) continue
            // A string, since this script's types have no DOM.
            const valid = await page.evaluate<boolean>(`CSS.supports(${JSON.stringify(`selector(${selector})`)})`)
            if (!valid) badSelectors.add(selector)
          }
          await page.addStyleTag({ content: hideStyle(hide) })
        }
        await page.screenshot({ path: file, animations: 'disabled' })
        await writeThumb(browser, file)
        console.log(`${frame.id}  ${beat.id}  ${url}`)
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
  for (const selector of badSelectors) {
    console.warn(`hide: "${selector}" is not a valid CSS selector, so it was skipped.`)
  }
  const total = beats.length * frames.length
  const parts = [`${total - failed - redirected} of ${total} captured`]
  if (redirected > 0) parts.push(`${redirected} redirected`)
  if (failed > 0) parts.push(`${failed} failed`)
  console.log(`${parts.join(', ')}, in src/shots/<device>/.`)
  // Redirects are reported but exit 0: they need a different screen source, not a rerun.
  if (failed > 0) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
