import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Monitor, RectangleHorizontal, Smartphone, type LucideIcon } from 'lucide-react'
import type { Beat, Issue } from '../content/parseFlows.ts'
import type { Chrome, DeviceFrame } from '../device/devices.ts'

const DEVICE_ICON: Record<Chrome, LucideIcon> = {
  web: Monitor,
  iphone: Smartphone,
  android: Smartphone,
  plain: RectangleHorizontal,
}

type TopBarProps = {
  name: string
  view: 'map' | 'live'
  frames: DeviceFrame[]
  frame: DeviceFrame
  beats: Beat[]
  /** Beats with no screen on the current device, in flows.md order. */
  missing: Beat[]
  errors: Issue[]
  hints: Issue[]
  onView: (view: 'map' | 'live') => void
  onDevice: (id: string) => void
  onGoToBeat: (beatId: string) => void
  children?: ReactNode
}

export function TopBar({
  name,
  view,
  frames,
  frame,
  beats,
  missing,
  errors,
  hints,
  onView,
  onDevice,
  onGoToBeat,
  children,
}: TopBarProps) {
  return (
    <header className="topbar">
      <h1 className="topbar-name">{name || 'Untitled product'}</h1>
      <nav className="view-tabs" aria-label="View">
        {(['map', 'live'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className="view-tab"
            aria-current={view === item ? 'page' : undefined}
            onClick={() => onView(item)}
          >
            {item === 'map' ? 'Map' : 'Live'}
          </button>
        ))}
      </nav>
      <div className="topbar-end">
        {children}
        <ProgressChip
          total={beats.length}
          missing={missing}
          errors={errors}
          hints={hints}
          deviceLabel={frames.length > 1 ? frame.label : null}
          onGoToBeat={onGoToBeat}
        />
        {frames.length > 1 ? <DeviceSwitch frames={frames} frame={frame} onDevice={onDevice} /> : null}
      </div>
    </header>
  )
}

function DeviceSwitch({
  frames,
  frame,
  onDevice,
}: {
  frames: DeviceFrame[]
  frame: DeviceFrame
  onDevice: (id: string) => void
}) {
  return (
    <div className="device-switch" role="group" aria-label="Device">
      {frames.map((item) => {
        const Icon = DEVICE_ICON[item.chrome]
        return (
          <button
            key={item.id}
            type="button"
            className="device-button"
            aria-label={item.label}
            aria-pressed={item.id === frame.id}
            onClick={() => onDevice(item.id)}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="tip" aria-hidden="true">
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ProgressChip({
  total,
  missing,
  errors,
  hints,
  deviceLabel,
  onGoToBeat,
}: {
  total: number
  missing: Beat[]
  errors: Issue[]
  hints: Issue[]
  deviceLabel: string | null
  onGoToBeat: (beatId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const done = total - missing.length
  const hasDetail = missing.length > 0 || errors.length > 0 || hints.length > 0

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Escape closes the list first. Live's own Escape waits for the next press.
      event.stopImmediatePropagation()
      setOpen(false)
      button.current?.focus()
    }
    const onDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const label = `${done} of ${total} screens${deviceLabel ? ` on ${deviceLabel}` : ''}`

  return (
    <div className="progress" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="progress-chip"
        aria-label={errors.length > 0 ? `${label}, ${errors.length} problems in flows.md` : label}
        aria-expanded={hasDetail ? open : undefined}
        aria-controls={hasDetail ? listId : undefined}
        disabled={!hasDetail}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="progress-long" aria-hidden="true">
          {done} of {total} screens
        </span>
        <span className="progress-short" aria-hidden="true">
          {done}/{total}
        </span>
        {errors.length > 0 ? <span className="progress-dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div className="progress-pop" id={listId}>
          {missing.length > 0 ? (
            <section>
              <h2>No screen yet{deviceLabel ? ` on ${deviceLabel}` : ''}</h2>
              <ul>
                {missing.map((beat) => (
                  <li key={beat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        onGoToBeat(beat.id)
                      }}
                    >
                      <span className="progress-id">{beat.id}</span>
                      {beat.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {errors.length > 0 ? (
            <section>
              <h2>Problems in flows.md</h2>
              <ul className="progress-notes is-error">
                {errors.map((item) => (
                  <li key={item.message}>{item.message}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {hints.length > 0 ? (
            <section>
              <h2>Unhappy-path gaps</h2>
              <ul className="progress-notes">
                {hints.map((item) => (
                  <li key={item.message}>{item.message}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
