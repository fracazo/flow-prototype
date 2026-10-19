import { createContext, useContext } from 'react'
import { frames } from '../content/prototype.ts'
import type { DeviceFrame } from './devices.ts'

/** The device the viewer is showing right now. App sets it from the device toggle. */
export const DeviceContext = createContext<DeviceFrame>(frames[0])

export function useFrame() {
  return useContext(DeviceContext)
}
