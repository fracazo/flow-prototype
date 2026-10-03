import type { ReactNode } from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import type { DeviceFrame } from './devices.ts'

type PhoneFrameProps = {
  children: ReactNode
  label: string
  frame: DeviceFrame
  className?: string
  landmark?: boolean
}

export function PhoneFrame({ children, label, frame, className, landmark = true }: PhoneFrameProps) {
  const Tag = landmark ? 'section' : 'div'
  const showStatus = frame.chrome === 'iphone' || frame.chrome === 'android' || frame.chrome === 'watch'
  const showHome = frame.chrome === 'iphone' || frame.chrome === 'android'

  return (
    <Tag
      className={['phone', `device-${frame.chrome}`, className].filter(Boolean).join(' ')}
      style={{ width: frame.width, height: frame.height, borderRadius: frame.radius }}
      aria-label={landmark ? label : undefined}
    >
      {frame.chrome === 'iphone' ? <div className="phone-island" aria-hidden="true" /> : null}
      {frame.chrome === 'web' ? (
        <div className="device-browser" aria-hidden="true">
          <span className="device-dots" />
          <span className="device-url">preview</span>
        </div>
      ) : null}
      {showStatus ? (
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          {frame.chrome === 'watch' ? null : (
            <span className="phone-status-icons" aria-hidden="true">
              <Signal size={16} strokeWidth={1.5} />
              <Wifi size={16} strokeWidth={1.5} />
              <BatteryFull size={18} strokeWidth={1.5} />
            </span>
          )}
        </div>
      ) : null}
      <div className="phone-screen">{children}</div>
      {showHome ? <div className="phone-home" aria-hidden="true" /> : null}
    </Tag>
  )
}
