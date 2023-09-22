import type { DispatchMessage } from '../dispatch'
import { resolveRoute } from '../router'
import { initSatoriServer } from '../satori/server'
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

  const dispatchers: ((message: DispatchMessage) => void)[] = []

  // 使用独立循环可避免已启动的服务继续运行
  for (const server of config.servers!)
    if (server.token === 'DEFINE_CHRONO_TOKEN')
      throw new Error(
        '请先修改服务密码（token）。了解更多：https://chronocat.vercel.app/config',
      )

  for (const server of config.servers!) {
    if (!server.enable) continue

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
        dispatchers.push((message) => {
          switch (message.type) {
            case 'message::recv': {
              void message
                .toRed()
                .then((x) => broadcastAbleServer.broadcast('message::recv', x))
              return
            }
          }
        })
        break
      }

      case 'satori': {
        const { dispatcher } = await initSatoriServer(server)
        dispatchers.push(dispatcher)
        break
      }
    }
  }

  const dispatchMessage = (message: DispatchMessage) =>
    dispatchers.forEach((x) => x(message))

  return {
    dispatchMessage,
  }
}
