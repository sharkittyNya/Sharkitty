import type { Message } from './red'

export interface DispatchMessage {
  type: 'message::recv'
  toRed: () => Promise<unknown>
  toSatori: () => Promise<unknown[]>
}

export class MessageRecvDispatchMessage implements DispatchMessage {
  constructor(private messages: Message[]) {}
  type = 'message::recv' as const
  toRed = async () => this.messages

  toSatori = async () => this.messages.map(() => undefined).filter(Boolean)
}
