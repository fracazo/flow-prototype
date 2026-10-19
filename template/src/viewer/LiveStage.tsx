import { useEffect, useRef, useState } from 'react'
import type { Beat, Edge } from '../content/parseFlows.ts'
import { useFrame } from '../device/DeviceContext.ts'
import { PhoneFrame } from '../device/PhoneFrame.tsx'
import { BeatScreen } from '../device/BeatScreen.tsx'
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
  const frame = useFrame()

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const availH = stage.clientHeight - 48
      const availW = stage.clientWidth - 40
      setFit(Math.min(1, availH / frame.height, availW / (frame.width + 256)))
      // The frame must be laid out at its real size and only then scaled.
      const phone = stage.querySelector<HTMLElement>('.live-row > .phone')
      if (phone && (phone.offsetWidth !== frame.width || phone.offsetHeight !== frame.height)) {
        console.error(
          `Live laid out ${frame.label} at ${phone.offsetWidth}×${phone.offsetHeight}, not ${frame.width}×${frame.height}.`,
        )
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [frame.height, frame.width, frame.label])

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
      <div className="live-fit" style={{ width: (frame.width + 256) * fit, height: frame.height * fit }}>
        <div className="live-row" style={{ transform: `scale(${fit})` }}>
          <PhoneFrame frame={frame} label={`${beat.id} ${beat.title}`}>
            <BeatScreen beat={beat} frame={frame} interactive onFollow={onFollow} />
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
