---
name: flow-prototype
description: Set up a clickable flow prototype for any product on any device, including iPhone, Android, web, watch, and TV. Map shows every screen of every flow. Live walks one path, screen by screen, in that device's frame. Use when the user wants a flow map, a clickable prototype, flows.md, design.md, or every screen of a product on one page.
---

# Flow prototype

A standalone Vite app for any product, on any device. Map shows every screen. Live walks one path, screen by screen, in that device's frame. What exists lives in `flows.md`. How it looks lives in `design.md`.

The prototype is its own Vite app with its own `package.json`. For an existing product it may sit beside the product, for example `<repo>/prototype/`, so it can read the product's files. Never put it inside the product's `src` or build.

## Core principle

**The frame matches the device, and the words on it come from flows.md.**

Do not assume iPhone. Ask which device before you start, and write the answer in `flows.md`. The frame keeps that size and aspect ratio. Do not stretch it, crop it, or scale it on one axis. Live may shrink the whole frame uniformly so it fits the window.

```md
device: iphone
```

Names: `iphone`, `android`, `web`, `watch`, `tv`. For another screen, use a size: `device: 1024x640`. A missing line uses iPhone. An unknown name is an error and falls back to iPhone. A watch has no status island. A TV is a wide screen. A web page is a browser window. Do not hardcode 393×852 in a screen.

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
5. Replace `flows.md` with the real product. For an existing product, add `url:` to each beat that already exists and run `npm run capture` (see Screenshots).
6. Open `#/map`. Stop and show the user the map before writing real screens.

## flows.md

```md
# Product name
> One line promise of the product.
device: iphone

## 1 | Getting in
> One line summary of the flow.

### 1.1 | Get started
why: One sentence on why this beat exists.
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

Never change `flows.md` silently. If a beat or edge is missing, say so and suggest the exact lines.

## Views

Two views of the same beats. The page around the phones is dark. Its look is in `src/styles/viewer.css`, which reads only `--viewer-*` tokens. Do not restyle the viewer to match the product, and do not put product tokens in `viewer.css`.

### Map

`#/map`

- Flows are rows. Beats sit left to right.
- Each node is the phone, scaled down.
- Edges are colored by type. A legend toggles each type.
- Click a node to select it. The outline sits on the phone, with a margin, so the selection is visible.
- Open Live from a node.
- Zoom controls only. No minimap.

### Live

`#/live/1.1`

- One device frame at that product's real size, plus the beat's why and its edges.
- Arrow right follows `happy`. Arrow left follows `back`. Escape returns to the map.
- The frame scales uniformly to fit. It never grows past 1.

## Screens

One file per beat: `src/screens/1.1.tsx`. Register it in `src/screens/index.ts`. A beat with no component renders the grey placeholder. That is correct until the screen exists.

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

- Render inside the phone. Read copy from `beat.copy`.
- Use `go` from `src/screens/go.ts`. Primary follows `happy`. Back follows `back`.
- Plain CSS and the variables in `src/styles/tokens.css`. No Tailwind.
- Real content only. No lorem ipsum. Invent names and numbers once and reuse them.
- Icons are Lucide, stroke 1.5, unless `design.md` says otherwise.

A full-bleed screenshot fills the phone with `object-fit: contain`. Do not use `fill`. Hide the frame's status bar, island, and home indicator when the image already includes them. Put the tap target on the control in the image, not on a made-up sheet.

## Checks

On load, the viewer lists errors. It does not crash.

- An edge points at a beat that does not exist.
- A beat has no `why`.
- A beat has no screen component yet.
- A beat has no outgoing edge and is not `end: true`.

Do not add a banner for beats that lack a refusal or back edge.

## What this skill is not

- Not a panel of UI variations inside an existing app.
- Not Storybook, and not a second design system.
- Not three extra views. Map and Live are the prototype.

It is a way to see every screen of a product, on any device, and to walk the path from one to the next.
