export type SatoriWebSocketIncomingMessage =
  | SatoriWebSocketIncomingHeartbeatMessage
  | SatoriWebSocketIncomingVerifyMessage

export enum SatoriOp {
  Event = 0,
  Ping = 1,
  Pong = 2,
  Identify = 3,
  Ready = 4,
}

export interface SatoriWebSocketIncomingHeartbeatMessage {
  op: SatoriOp.Ping
  body: never
}

export interface SatoriWebSocketIncomingVerifyMessage {
  op: SatoriOp.Identify
  body?: {
    token?: string
  }
}
