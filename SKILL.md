---
name: flow-prototype
description: Set up a clickable flow prototype for any product on any device, including iPhone, Android, web, watch, and TV. Map shows every screen of every flow. Live walks one path, screen by screen, in that device's frame. Use when the user wants a flow map, a clickable prototype, flows.md, design.md, or every screen of a product on one page.
---

# Flow prototype

A standalone Vite app for any product, on any device. Map shows every screen. Live walks one path, screen by screen, in that device's frame. What exists lives in `flows.md`. How it looks lives in `design.md`.

It has its own `package.json`. For an existing product it may sit beside the product, for example `<repo>/prototype/`, so it can read the product's files. Never put it inside the product's `src` or build.

## Core principle

**The frame matches the device, and what is on it comes from the product: a screenshot, or copy in flows.md.**

Do not assume iPhone. Ask which device before you start, and write the answer in `flows.md`. The frame keeps that size and aspect ratio. Do not stretch it, crop it, or scale it on one axis. Live may shrink the whole frame uniformly so it fits the window.

```md
device: iphone
```

Names: `iphone`, `android`, `web`, `watch`, `tv`. For another screen, use a size: `device: 1024x640`. A missing line uses iPhone. An unknown name is an error and is skipped.

A product on more than one device lists them all: `device: web, iphone`. The first is the default. Map and Live get a device toggle, and the URL keeps the choice (`#/live/1.2?device=iphone`). Every beat is drawn on every device: a screen reads `frame` and lays itself out for it, and `npm run capture` shoots each `url:` once per device. A watch has no status island. A TV is a wide screen. A web page is a browser window. Do not hardcode 393×852 in a screen.

Copy, colors, and spacing are not typed into components. If something is missing from `flows.md` or `design.md`, ask, or add it there first.

## Start a prototype

The viewer is in `template/` next to this file.

### 0. Does the product already exist?

Ask if it is not clear. If there is code, a live site, or a design system, do this before anything else. It is the fast path: most beats become screenshots, and only new beats are built by hand.

1. **Routes.** Find the router (a `routes` file, `app/` or `pages/` folders, a steps config, a nav component). List each user-facing route with its URL. Check that each one is still in use: a config can outlive the screen it describes. Show the user the list and ask which flows the prototype covers.
2. **Design source.** Look, in this order, for a tokens file (`tokens.css`, `theme.ts`, `tailwind.config.*`, CSS variables in a global stylesheet), a `DESIGN.md` or brand doc, Storybook, then the live site. Name the source at the top of `design.md`.
3. **Generate `design.md` and `tokens.css`** from that source. Copy values, do not guess them. Use the product's own token names in `tokens.css`. The viewer does not read them, so any names work.
4. **Copy.** Long copy on existing screens comes from the screenshot, not from `flows.md`. Only type copy for beats you build by hand.

For a new product, skip this step and agree `design.md` with the user first.

### 1. Set up

1. Ask which device, or devices, the product runs on. Do not default to iPhone.
2. Copy `template/` into an empty folder. Do not copy `node_modules`.
3. Run `npm install`, then `npm run dev`.
4. `design.md` ships blank. Fill it (step 0, or with the user) before writing any screen. A filled-in sample is in `examples/` next to this file. It belongs to another product: never copy its values.
5. Replace `flows.md` with the real product. For an existing product, add `url:` to each beat that already exists and run `npm run capture` (see Screenshots first).
6. Open `#/map`. Stop and show the user the map before writing real screens.

## flows.md

```md
# Product name
> One line promise of the product.
device: iphone
base: http://localhost:3000

## 1 | Getting in
> One line summary of the flow.

### 1.1 | Get started
why: One sentence on why this beat exists.
url: /welcome
screen: Short description of the layout.
copy:
- title: ...
- body: ...
- primary: ...
edges:
- happy -> 1.2
- back -> 1.1
```

- Flow ids are integers. Beat ids are `flow.beat`, such as `1.4`.
- `copy` keys are free form. A screen uses that copy word for word.
- Long copy is a block. Put `|` after the key and indent the text under it. A blank line starts a new paragraph. Do not invent `body2`, `body3`.

  ```md
  - body: |
      First paragraph, which may wrap
      over several lines.

      Second paragraph.
  ```

  In a screen, `paragraphs(beat.copy.body)` from `src/screens/copy.ts` returns one string per paragraph.
- Six edge types, and nothing else: `happy`, `branch`, `refusal`, `back`, `sheet`, `inline`.
  - `happy`: next step when all goes well.
  - `branch`: a real alternative route.
  - `refusal`: the system says no.
  - `back`: the user backs out.
  - `sheet`: a layer on top of the current beat.
  - `inline`: the screen changes state and the user does not move.
- An edge may point at another flow (`- branch -> 3.1`).
- A beat with no outgoing edge is marked `end: true`.
- A section `## Shared | Home & chrome` uses flow id `S` and beats `S.1`, `S.2`.
- `url:` marks a beat that already exists in the product. It is a path from `base:`, or a full URL. A beat with a `url:` needs no `copy:`: the words come from the screenshot.
- `image:` names a screenshot file in `src/shots/` when it is not `<beat id>.png`. Use it for states a URL cannot reach.
- `bleed: true` says the image already has the status bar and home indicator, so the frame hides its own.

Never change `flows.md` silently. If a beat or edge is missing, say so and suggest the exact lines.

## Views

Two views of the same beats. The page around the phones is dark. Its look is in `src/styles/viewer.css`, which reads only `--viewer-*` tokens. Do not restyle the viewer to match the product, and do not put product tokens in `viewer.css`.

### Map

`#/map`

- Flows are rows. Beats sit left to right.
- Each node is the phone, scaled down.
- Edges are colored by type. A legend toggles each type.
- Click a node to select it. The outline sits on the phone, with a margin, so the selection is visible.
- Selecting a node dims the beats it does not connect to. Click empty canvas to clear. Hover never changes the map: nodes slide under the cursor while zooming, and hover focus made the whole map flash.
- Open Live from a node.
- Zoom controls only. No minimap.

### Live

`#/live/1.1`

- One device frame at that product's real size, plus the beat's why and its edges.
- Arrow right follows `happy`. Arrow left follows `back`. Escape returns to the map.
- The frame scales uniformly to fit. It never grows past 1.

## Screens

Each beat renders one of three things, in this order:

1. A hand-built component registered in `src/screens/index.ts`.
2. A screenshot in `src/shots/<device>/<beat id>.png`, or `src/shots/<beat id>.png` for every device.
3. The grey placeholder. That is correct until the screen exists.

### Screenshots first

Screens that already exist are screenshots, not rebuilds. Hand-build only the beats that do not exist yet. That is where the prototype earns its keep.

```bash
npm run capture:setup      # once: downloads Chromium for Playwright
npm run capture            # every beat with a url:
npm run capture -- 1.2 1.3 # only these beats
npm run capture -- --login # sign in by hand once, then capture signed in
```

- The script opens each `url:` at the device's screen size, minus the frame's status bar, home indicator, or browser bar, at 2x. Phones get a mobile user agent and touch.
- `--login` opens a real browser at `base:`. The user signs in themselves. The session is saved to `capture-auth.json`, which is gitignored. Never type the user's password for them.
- If the log says a beat was redirected, the session is missing or expired. Run `--login` again.
- A URL only reaches what a fresh page load shows. Mid-flow states (step 3 of a form, an error, an open sheet) need a hand-made screenshot saved under `image:`, or a hand-built screen. Say which beats these are. Do not fake them with the wrong URL.
- In Live, a click anywhere on a screenshot follows `happy`. The edge buttons beside the frame follow the rest. When a beat needs real tap targets, build it by hand.
- A screenshot fills the screen with `object-fit: contain`. Never `fill`.
- Commit `src/shots/` with the prototype. Run the capture again when the product changes.

### Hand-built screens

One file per beat: `src/screens/1.1.tsx`. Register it in `src/screens/index.ts`.

```tsx
export function Start({ beat, interactive, onFollow }: ScreenProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (interactive) go(beat, 'happy', onFollow)
      }}
    >
      {beat.copy.primary}
    </button>
  )
}
```

- Render inside the phone. Read copy from `beat.copy`. Read the size from `frame`, never a hardcoded width.
- Use `go` from `src/screens/go.ts`. Primary follows `happy`. Back follows `back`.
- Style with the product's own tools: plain CSS and the variables in `src/styles/tokens.css`, or Tailwind when the product uses it (below). Never the `--viewer-*` tokens.
- Real content only. No lorem ipsum. Invent names and numbers once and reuse them.
- Icons are Lucide, stroke 1.5, unless `design.md` says otherwise.
- A hand-built screen that shows an image uses the screenshot rules: `object-fit: contain`, and hide the frame's status bar, island, and home indicator when the image already includes them. Put the tap target on the control in the image, not on a made-up sheet.

### When the product uses Tailwind

Use its classes, so a screen reads like the product's own code. Turn it on once:

1. `npm i -D tailwindcss @tailwindcss/vite`, at the product's major version.
2. Add `tailwindcss()` from `@tailwindcss/vite` to `plugins` in `vite.config.ts`.
3. Create `src/styles/screens.css` and import it in `src/main.tsx` after `viewer.css`:

   ```css
   @layer theme, utilities;
   @import 'tailwindcss/theme.css' layer(theme);
   @import 'tailwindcss/utilities.css' layer(utilities);
   @source '../screens';

   /* The product's @theme block, copied from its CSS, or @import that file. */
   ```

Leave out Tailwind's preflight (`@import 'tailwindcss'` pulls it in). It resets every element on the page, and the viewer would lose its look.

### Reusing the product's components

Copy small presentational components (a button, a card, a row) into `src/screens/ui/` and keep their class names. When the prototype sits beside the product, an alias can import them in place instead:

```ts
// vite.config.ts, with: import { fileURLToPath } from 'node:url'
resolve: {
  alias: { '@product': fileURLToPath(new URL('../src', import.meta.url)) },
  dedupe: ['react', 'react-dom'],
},
```

Only do this for components that render from props. Anything that needs the product's providers, router, data fetching, or auth stays out: screenshot that screen instead. Install whatever the component imports (`clsx`, `@radix-ui/*`) here too, and check `npm run build` passes.

## Checks

On load, the viewer lists errors. It does not crash.

- An edge points at a beat that does not exist.
- A beat has no `why`.
- A beat has no screen component or screenshot yet.
- A beat has a `url:` but no screenshot yet.
- A beat has a relative `url:` and there is no `base:`.
- A beat has no outgoing edge and is not `end: true`.

Live also logs a console error when a frame is laid out at any size other than its real one. Check the console after adding a wide device.

Do not add a banner for beats that lack a refusal or back edge.

## What this skill is not

- Not a panel of UI variations inside an existing app.
- Not Storybook, and not a second design system.
- Not three extra views. Map and Live are the prototype.

It is a way to see every screen of a product, on any device, and to walk the path from one to the next.
