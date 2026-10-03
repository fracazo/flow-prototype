# Flow prototype

Sets up a clickable flow prototype for any product, on any device: iPhone, Android, web, watch, TV, or whatever it runs on. You write the screens and the paths between them. A coding agent builds two views from that:

- **Map** puts every screen of every flow on one page, so the whole product can be scanned at once.
- **Live** walks one path the way a person would, screen by screen, in that device's frame.

```bash
npx skills add fracazo/flow-prototype
```

[skills.sh/fracazo/flow-prototype](https://skills.sh/fracazo/flow-prototype)

The skill includes a `template/` folder. Copy it into an empty project, run `npm install`, then replace `flows.md` with the product.
