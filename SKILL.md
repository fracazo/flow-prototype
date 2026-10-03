---
name: flow-prototype
description: Set up a clickable flow prototype for any product. Map shows every screen of every flow. Live walks one path, screen by screen, at phone size. Use when the user wants a flow map, a clickable prototype, flows.md, design.md, or every screen of a product on one page.
---

# Flow prototype

A standalone Vite app for any product. Map shows every screen. Live walks one path, screen by screen. What exists lives in `flows.md`. How it looks lives in `design.md`.

This is its own project. Do not install it inside an existing app.

## Core principle

**Each screen is shown at phone size, and the words on it come from flows.md.**

The frame is 393×852, the size of a current phone. Do not stretch it, crop it, or scale it on one axis. Live may shrink the whole frame uniformly so it fits the window. Copy, colors, and spacing are not typed into components. If something is missing from `flows.md` or `design.md`, ask, or add it there first.

## Start a prototype

The viewer is in `template/` next to this file.

1. Copy `template/` into an empty folder. Do not copy `node_modules`.
2. Run `npm install`, then `npm run dev`.
3. Open `#/map`. The example flow is two placeholder phones. Replace `flows.md` with the real product before building screens.
4. Stop and show the user the map before writing real screens.

## flows.md

```md
# Product name
> One line promise of the product.

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
- Edge types, and nothing else: `happy`, `branch`, `refusal`, `back`, `sheet`, `inline`.
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

Two views of the same beats. The page around the phones is dark. Its colors are in `design.md` under Viewer.

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

- One phone at 393×852, plus the beat's why and its edges.
- Arrow right follows `happy`. Arrow left follows `back`. Escape returns to the map.
- The phone scales uniformly to fit. It never grows past 1.

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

It is a way to see every screen of a mobile product, and to walk the path from one to the next.
