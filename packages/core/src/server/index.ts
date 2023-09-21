import { resolveRoute } from '../router'
import { getAuthData } from '../utils/authData'
import { getConfig } from '../utils/config'
import { HeaderAuthorizer, PayloadAuthorizer } from './authorizer'
import type { HttpRouterServerInstance } from './httpIncomeRouterServer'
import { httpRouterServer } from './httpIncomeRouterServer'
import type { WebsocketRouterServerInstance } from './webSocketIncomeRouterServer'
import { wsRouterServer } from './webSocketIncomeRouterServer'

declare const __DEFINE_CHRONO_VERSION__: string

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
    mountHTTPServer: (httpServer as HttpRouterServerInstance).server,
    connectPayload,
  })

  return {
    binaryServer: httpServer,
    broadcastAbleServer: wsServer,
  } as {
    binaryServer: HttpRouterServerInstance
    broadcastAbleServer: WebsocketRouterServerInstance
  }
}

export const initServers = async () => {
  const config = await getConfig()
  const authData = await getAuthData()

  const broadcasts: ((type: string, payload: unknown) => void)[] = []

  for (const server of config.servers!) {
    switch (server.type) {
      case 'red': {
        const { broadcastAbleServer } = createNormalServers(
          server.token,
          () => ({
            version: __DEFINE_CHRONO_VERSION__,
            name: 'chronocat',
            authData,
          }),
        )
        broadcasts.push(broadcastAbleServer.broadcast.bind(broadcastAbleServer))
        break
      }
      case 'satori': {
        break
      }
    }
  }

  const send = (type: string, payload: unknown) =>
    broadcasts.forEach((x) => x(type, payload))

  return {
    send,
  }
}
