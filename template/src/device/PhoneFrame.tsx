import type { ReactNode } from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'

type PhoneFrameProps = {
  children: ReactNode
  label: string
  className?: string
  landmark?: boolean
  height?: number
}

export function PhoneFrame({ children, label, className, landmark = true, height }: PhoneFrameProps) {
  const Tag = landmark ? 'section' : 'div'
  return (
    <Tag
      className={className ? `phone ${className}` : 'phone'}
      style={height ? { height } : undefined}
      aria-label={landmark ? label : undefined}
    >
      <div className="phone-island" aria-hidden="true" />
      <div className="phone-status" aria-hidden="true">
        <span>9:41</span>
        <span className="phone-status-icons" aria-hidden="true">
          <Signal size={16} strokeWidth={1.5} />
          <Wifi size={16} strokeWidth={1.5} />
          <BatteryFull size={18} strokeWidth={1.5} />
        </span>
      </div>
      <div className="phone-screen">{children}</div>
      <div className="phone-home" aria-hidden="true" />
    </Tag>
  )
}
