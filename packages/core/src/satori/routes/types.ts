import type { IncomingMessage, ServerResponse } from 'node:http'

export interface RouteContext {
  req: IncomingMessage
  res: ServerResponse<IncomingMessage>
  buffer: () => Promise<Buffer>
  string: () => Promise<string>
  json: () => Promise<unknown>
}

export type Route = (ctx?: RouteContext) => Promise<unknown>
