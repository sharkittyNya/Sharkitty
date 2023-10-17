import type { ChronocatSatoriEventsConfig } from './config/types'
import type { Message } from './red'
import { buildParser } from './satori/parser'
import type { Event } from './satori/types'
import { getAuthData } from './utils/authData'

export interface DispatchMessage {
  type: 'message::recv'
  toRed: () => Promise<unknown>
  toSatori: (config: ChronocatSatoriEventsConfig) => Promise<Event[]>
}

export class MessageRecvDispatchMessage implements DispatchMessage {
  constructor(private messages: Message[]) {}
  type = 'message::recv' as const
  toRed = async () => this.messages

  toSatori = async (config: ChronocatSatoriEventsConfig) => {
    const authData = await getAuthData()

    const events = await Promise.all(
      this.messages.map(buildParser(authData.uin, config)),
    )

    return events
      .filter(Boolean as unknown as (es: Event[] | undefined) => es is Event[])
      .flat()
      .filter(Boolean as unknown as (e: Event | undefined) => e is Event)
  }
}
