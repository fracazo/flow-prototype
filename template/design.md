# Design

The look is calm and airy. A soft sky gradient sits behind every screen, content lives on white frosted cards, and there is one strong action per screen: a black pill button. Big numbers carry the story (savings, money), everything else stays quiet.

## Tokens

### Color (app)
- bg-top: #BFD9EA
- bg-bottom: #E6E8EE
- screen background: linear gradient from bg-top to bg-bottom, top to bottom
- surface: rgba(255,255,255,0.72) with backdrop blur 20px
- surface-solid: #FFFFFF
- ink: #0E1116
- ink-2: #4A5260
- ink-3: #8A92A0
- line: rgba(14,17,22,0.08)
- primary: #0E1116 (button fill), on-primary: #FFFFFF
- accent: #F5B53D (sun)
- success: #2FA36B
- danger: #E0484F

### Type
- Font: Inter (Google Fonts), numbers use tabular figures.
- display: 40/44, weight 500, tracking -0.02em (money: cents at 60% size)
- title: 22/28, weight 600
- body: 15/21, weight 400
- label: 13/18, weight 500
- caption: 12/16, weight 400, ink-3

### Space and shape
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48
- Screen side padding: 20
- Radius: card 20, field 14, button 999 (pill), icon tile 22
- Shadow: 0 8px 24px rgba(14,17,22,0.08)

## Components
- Button: primary (black pill, 52 tall, full width), secondary (white pill), text link (underlined label).
- Field: label above, white field, 52 tall.
- CodeInput: 6 boxes, error state turns boxes red with a shake.
- Card: surface, radius 20, padding 16.
- ListRow: icon tile, title, subtitle, chevron.
- IconTile: 64 square, white, radius 22, soft shadow, holds one line icon.
- Money: big number with small cents.
- BarChart: simple bars, current period highlighted.
- Sheet: bottom sheet over a dimmed screen, radius 28 top corners.
- TabBar: floating pill at the bottom with icons and the Pro's avatar.
- EmptyState: IconTile, title, body, one button.

Icons: Lucide, 1.5 stroke.

## Voice
- Plain English. Short sentences. Talk like a helpful neighbour.
- Say what happened and what to do next. Never blame the user.
- Buttons are verbs: "Get started", "Enter the code", "That's my home".
- No jargon on screen. If a term is needed, explain it in one line.

## Viewer (the page around the phones)
- bg: #111316
- panel: #181B1F, border #24282E
- text: #E8EAED, muted: #7C838E
- selected card: white with dark text
- Edge colors: happy #8A92A0 solid, branch #4C9BE8 dashed, refusal #E8913A dashed, back #8A92A0 dotted, sheet #9B6BF0 dotted, inline #E0484F dashed
- Flow colors (dots on map nodes, cycle in order): #7B6CF6, #4C9BE8, #3FBF7F, #E8913A, #E0484F, #C06CF0
