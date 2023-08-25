import { resolveRoute } from '../router'
import { HeaderAuthorizer, PayloadAuthorizer } from './authorizer'
import type { HttpRouterServerInstance } from './httpIncomeRouterServer'
import { httpRouterServer } from './httpIncomeRouterServer'
import type { WebsocketRouterServerInstance } from './webSocketIncomeRouterServer'
import { wsRouterServer } from './webSocketIncomeRouterServer'

export const createNormalServers = (
  token: string,
  connectPayload: () => unknown,
) => {
  const httpServer = httpRouterServer.createServer(resolveRoute, {
    authorizer: HeaderAuthorizer(token),
    rootPath: '/api/',
    port: 16530,
  })

  const wsServer = wsRouterServer.createServer(resolveRoute, {
    authorizer: PayloadAuthorizer(token),
    rootPath: '/',
    port: 16530,
    mountHTTPServer: (httpServer as HttpRouterServerInstance).server,
    connectPayload,
  })

  ;(httpServer as HttpRouterServerInstance).listen()

  return {
    binaryServer: httpServer,
    broadcastAbleServer: wsServer,
  } as {
    binaryServer: HttpRouterServerInstance
    broadcastAbleServer: WebsocketRouterServerInstance
  }
}
