import type { EdgeType } from '../content/parseFlows.ts'
import type { ScreenProps } from '../screens/index.ts'
import { edgeLabel } from '../viewer/edgeLabel.ts'

const ACTION_CLASS: Record<EdgeType, string> = {
  happy: 'action-primary',
  branch: 'action-secondary',
  refusal: 'action-secondary',
  back: 'action-text',
  sheet: 'action-secondary',
  inline: 'action-secondary',
}

export function PlaceholderScreen({ beat, interactive = false, onFollow }: ScreenProps) {
  const entries = Object.entries(beat.copy).filter(([key]) => key !== 'primary' && key !== 'secondary')

  return (
    <div className="placeholder">
      <p className="placeholder-tag">Placeholder</p>
      <h3>{beat.title}</h3>
      {entries.length === 0 ? (
        <p className="placeholder-empty">No copy on this beat.</p>
      ) : (
        <dl>
          {entries.map(([key, value]) => (
            <div className="copy-row" key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {interactive && beat.edges.length > 0 ? (
        <div className="placeholder-actions">
          {beat.edges.map((edge, index) => (
            <button
              className={ACTION_CLASS[edge.type]}
              key={`${edge.type}-${edge.target}-${index}`}
              type="button"
              onClick={() => onFollow?.(edge)}
            >
              {edgeLabel(edge, beat)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
