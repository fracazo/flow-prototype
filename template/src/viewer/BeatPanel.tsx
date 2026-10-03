import type { Beat } from '../content/parseFlows.ts'
import { ScaledPhone } from '../device/ScaledPhone.tsx'
import { edgeLabel } from './edgeLabel.ts'

type BeatPanelProps = {
  beat: Beat
  onClose: () => void
  onOpenLive: () => void
  onSelect: (beatId: string) => void
}

export function BeatPanel({ beat, onClose, onOpenLive, onSelect }: BeatPanelProps) {
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
      <ScaledPhone beat={beat} scale={0.64} landmark />
      <h3>Edges</h3>
      <ul className="panel-edges">
        {beat.edges.map((edge, index) => (
          <li key={`${edge.type}-${edge.target}-${index}`}>
            <button type="button" onClick={() => onSelect(edge.target)}>
              <span className={`legend-swatch swatch-${edge.type}`} aria-hidden="true" />
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
