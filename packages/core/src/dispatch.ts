import type { Message } from '@chronocat/red'

export interface DispatchMessage {
  type: 'message::recv'
  toRed: () => Promise<unknown>
}

export class MessageRecvDispatchMessage implements DispatchMessage {
  constructor(private messages: Message[]) {}
  type = 'message::recv' as const
  toRed = async () => this.messages
}
