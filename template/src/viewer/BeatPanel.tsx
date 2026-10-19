import type { Beat } from '../content/parseFlows.ts'
import { useFrame } from '../device/DeviceContext.ts'
import { ScaledPhone } from '../device/ScaledPhone.tsx'
import { edgeLabel } from './edgeLabel.ts'

type BeatPanelProps = {
  beat: Beat
  onClose: () => void
  onOpenLive: () => void
  onSelect: (beatId: string) => void
}

// The panel is 360 wide with 20 padding each side.
const PANEL_INNER = 320

export function BeatPanel({ beat, onClose, onOpenLive, onSelect }: BeatPanelProps) {
  const frame = useFrame()
  const scale = Math.min(0.64, PANEL_INNER / frame.width)

  return (
    <aside className="beat-panel" aria-label={`${beat.id} ${beat.title}`}>
      <div className="panel-toolbar">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button" className="panel-live" onClick={onOpenLive}>
          Open live
        </button>
      </div>
      <p className="beat-id">{beat.id}</p>
      <h2>{beat.title}</h2>
      <p className="beat-why">{beat.why}</p>
      {beat.screen ? <p className="beat-screen">{beat.screen}</p> : null}
      <ScaledPhone beat={beat} scale={scale} landmark />
      <h3>Edges</h3>
      <ul className="panel-edges">
        {beat.edges.map((edge, index) => (
          <li key={`${edge.type}-${edge.target}-${index}`}>
            <button type="button" onClick={() => onSelect(edge.target)}>
              <span className={`edge-sample sample-${edge.type}`} aria-hidden="true" />
              {edgeLabel(edge, beat)}
              <span className="panel-target">{edge.target}</span>
            </button>
          </li>
        ))}
        {beat.edges.length === 0 ? <li>No outgoing edge.</li> : null}
      </ul>
    </aside>
  )
}
