import type Element from '@satorijs/element'

export * from './satori'

export type WebSocketIncomingMessage =
  | WebSocketIncomingHeartbeatMessage
  | WebSocketIncomingVerifyMessage

export enum Op {
  Event = 0,
  Ping = 1,
  Pong = 2,
  Identify = 3,
  Ready = 4,
}

export interface WebSocketIncomingHeartbeatMessage {
  op: Op.Ping
  body: never
}

export interface WebSocketIncomingVerifyMessage {
  op: Op.Identify
  body?: {
    token?: string
  }
}

export interface MessageCreatePayload {
  channel_id: string
  content: Element.Fragment
}

export interface UserChannelCreatePayload {
  user_id: string
}
