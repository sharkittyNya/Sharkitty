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

export interface MemoryStoreItem {
  args: unknown[]
  expires: number
}
