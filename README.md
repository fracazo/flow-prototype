# Flow prototype

Sets up a clickable flow prototype for any product. You write the screens and the paths between them. A coding agent builds two views from that:

- **Map** puts every screen of every flow on one page, so the whole product can be scanned at once.
- **Live** walks one path the way a person would, screen by screen, at phone size.

The phone frame is only how each screen is shown. The flows can be any product.

```bash
npx skills add fracazo/flow-prototype
```

[skills.sh/fracazo/flow-prototype](https://skills.sh/fracazo/flow-prototype)

The skill includes a `template/` folder. Copy it into an empty project, run `npm install`, then replace `flows.md` with the product.
