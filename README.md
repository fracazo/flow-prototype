# Flow prototype

Sets up a clickable flow prototype for a mobile or desktop product: iPhone, Android, or web. Other screen sizes work as a plain frame, best effort. You write the screens and the paths between them. A coding agent builds two views from that:

- **Map** puts every screen of every flow on one page, so the whole product can be scanned at once.
- **Live** walks one path the way a person would, screen by screen, in that device's frame.

```bash
npx skills add fracazo/flow-prototype
```

[skills.sh/fracazo/flow-prototype](https://skills.sh/fracazo/flow-prototype)

The skill includes a `template/` folder. Copy it into an empty folder, run `npm install`, then fill `design.md` and replace `flows.md` with the product.

For a product that already exists, the agent reads its routes and design source first. Then it screenshots each existing screen with `npm run capture`, so only the new screens are built by hand. A product on several devices lists them all (`device: web, iphone`) and gets a device toggle.

For a portfolio or a pitch, `#/map?present&intro` hides the viewer's chrome, and `npm run record` renders a smooth 1920×1080, 60fps video of the map and Live. See "Recording a demo" in `SKILL.md`.

`examples/` holds a filled-in `design.md` and `tokens.css` from a sample product. It shows the format. It is not a default.
