import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { EDGE_TYPES, type EdgeType } from '../content/parseFlows.ts'

/** A small key in the map's corner. Collapsed, it is one row of line samples. Each type is a toggle. */
export function EdgeKey({ hidden, onToggle }: { hidden: ReadonlySet<EdgeType>; onToggle: (type: EdgeType) => void }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const shown = EDGE_TYPES.length - hidden.size

  return (
    <div className={open ? 'edge-key is-open' : 'edge-key'}>
      {open ? (
        <ul className="edge-key-list" id={listId} aria-label="Edge types">
          {EDGE_TYPES.map((type) => {
            const on = !hidden.has(type)
            return (
              <li key={type}>
                <button type="button" className="edge-key-item" aria-pressed={on} onClick={() => onToggle(type)}>
                  <span className={`edge-sample sample-${type}`} aria-hidden="true" />
                  {type}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
      <button
        type="button"
        className="edge-key-toggle"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Edge key, ${shown} of ${EDGE_TYPES.length} types shown`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="edge-key-samples" aria-hidden="true">
          {EDGE_TYPES.map((type) => (
            <span key={type} className={`edge-sample sample-${type}${hidden.has(type) ? ' is-off' : ''}`} />
          ))}
        </span>
        <ChevronDown className="edge-key-chevron" size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}
