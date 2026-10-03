import { useEffect, useRef, useState } from 'react'
import type { Beat, Edge } from '../content/parseFlows.ts'
import { PhoneFrame } from '../device/PhoneFrame.tsx'
import { PHONE_W, phoneHeight } from '../device/phoneSize.ts'
import { PlaceholderScreen } from '../device/PlaceholderScreen.tsx'
import { screens } from '../screens/index.ts'
import { edgeLabel } from './edgeLabel.ts'

type LiveStageProps = {
  beat: Beat
  onFollow: (edge: Edge) => void
  onRestart: () => void
  onOverview: () => void
}

export function LiveStage({ beat, onFollow, onRestart, onOverview }: LiveStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const Screen = screens[beat.id] ?? PlaceholderScreen
  const phoneH = phoneHeight(beat.id)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const availH = stage.clientHeight - 48
      const availW = stage.clientWidth - 40
      setFit(Math.min(1, availH / phoneH, availW / (PHONE_W + 256)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [phoneH])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOverview()
      if (event.key === 'ArrowRight') {
        const happy = beat.edges.find((edge) => edge.type === 'happy')
        if (happy) onFollow(happy)
      }
      if (event.key === 'ArrowLeft') {
        const back = beat.edges.find((edge) => edge.type === 'back')
        if (back) onFollow(back)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beat, onFollow, onOverview])

  return (
    <div className="live-stage" ref={stageRef}>
      <div className="live-fit" style={{ width: (PHONE_W + 256) * fit, height: phoneH * fit }}>
        <div className="live-row" style={{ transform: `scale(${fit})` }}>
          <PhoneFrame label={`${beat.id} ${beat.title}`} height={phoneH}>
            <Screen beat={beat} interactive onFollow={onFollow} />
          </PhoneFrame>
          <div className="live-controls">
            <button type="button" onClick={onRestart}>
              Restart
            </button>
            <button type="button" onClick={onOverview}>
              Overview
            </button>
            <p className="live-id">
              {beat.id} {beat.title}
            </p>
            <p className="live-why">{beat.why}</p>
            <ul className="edge-list">
              {beat.edges.map((edge, index) => (
                <li key={`${edge.type}-${edge.target}-${index}`}>
                  <button type="button" onClick={() => onFollow(edge)}>
                    {edgeLabel(edge, beat)} → {edge.target}
                  </button>
                </li>
              ))}
              {beat.end ? <li>end</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
