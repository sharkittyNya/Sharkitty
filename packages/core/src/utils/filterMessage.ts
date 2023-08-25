import { MsgType } from '@chronocat/red'
import type { MessageSendPayload, Message } from '@chronocat/red'

export const filterMessage = (message: MessageSendPayload | Message) =>
  'peer' in message
    ? !message.elements.some((x) => x.walletElement || x.arkElement)
    : !(message.msgType === MsgType.Ark || message.msgType === MsgType.Wallet)
