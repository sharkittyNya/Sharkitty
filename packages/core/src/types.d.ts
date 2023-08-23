import type { Profile, Group } from '@chronocat/red'

export type Uuid = string | number

export interface IpcEvent {
  eventName: string
  callbackId: Uuid
}

export type Detail = [
  {
    cmdName: string
    payload: unknown
  },
]

export interface ListenerData {
  Full: [unknown, IpcEvent, unknown]
  EventName: string
  CmdName: string
  Payload: unknown
  Request: unknown
}

export interface State {
  selfProfile?: Profile
  groupMap: Record<string, Group>
  friendMap: Record<string, unknown>
  responseMap: Record<
    Uuid,
    {
      resolved?: Detail
    }
  >
  requestMap: Record<Uuid, unknown>
  requestCallbackMap: Record<Uuid, (...args: unknown[]) => void>
  richMediaDownloadMap: Record<string, (path: string) => void>
}

export interface MemoryStoreItem {
  args: unknown[]
  expires: number
}
