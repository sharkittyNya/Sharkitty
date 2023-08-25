import type { Server } from 'node:http'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type {
  ConfigOf,
  RouteResolver,
  RouterServer,
  RouterServerCommonConfig,
  RouterServerInstance,
} from './abstract'

type JSONPayloadPacket = unknown

interface WebSocketIncomeRouterServerConfig
  extends RouterServerCommonConfig<JSONPayloadPacket> {
  rootPath: string
  mountHTTPServer: Server
  connectPayload: () => unknown
}

export class WebsocketRouterServerInstance implements RouterServerInstance {
  constructor(
    resolveRoute: RouteResolver,
    {
      authorizer,
      rootPath = '/',
      mountHTTPServer,
      port,
      connectPayload,
    }: ConfigOf<WebSocketIncomeRouterServerConfig>,
  ) {
    this.server = new WebSocketServer({
      server: mountHTTPServer,
      port,
      path: rootPath,
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server.on('connection', async (client) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      client.once('message', async (message) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-base-to-string
          const { type, payload } = JSON.parse(message.toString())

          if (type !== 'meta::connect')
            throw new Error('Invalid connect message')

          if (type === 'auth') {
            if (!(await authorizer(payload))) {
              client.close(401)
              return
            }
            this.wsAuthedClients.push(client)

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            client.on('message', async (message) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const {
                type,
                payload,
                echo,
              }: {
                type: string
                payload: unknown
                echo: unknown
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
              } = JSON.parse(message.toString())
              if (typeof type !== 'string') return
              const path = type.split('::')
              const route = resolveRoute(path)
              const reply = (payload: unknown) =>
                client.send(
                  JSON.stringify({
                    type: `${path.join('::')}::reply`,
                    payload,
                    echo,
                  }),
                )
              if (route) {
                if (route.options.httpOnly)
                  return reply({
                    error: 'route not supported',
                    reason: 'This route is http only',
                  })

                if (route.options.body === 'binary')
                  return reply({
                    error: 'route not supported',
                    reason: 'Binary body is not supported for websocket',
                  })

                if (route.options.body === 'json') {
                  if (typeof payload !== 'object')
                    return reply({
                      error: 'invalid payload',
                      reason: 'Payload must be an object for this route',
                    })
                }

                if (route.options.body === 'text') {
                  if (typeof payload !== 'string')
                    return reply({
                      error: 'invalid payload',
                      reason: 'Payload must be a string for this route',
                    })
                }

                const ctx = {
                  body: payload,
                  http: undefined,
                }

                try {
                  const result = await route.handler(ctx)
                  reply(result)
                } catch (e) {
                  console.error(e)
                  reply({
                    error: 'internal error',
                    reason: 'Internal error occurred',
                  })
                }
              }
            })

            client.on('disconnect', () =>
              this.wsAuthedClients.splice(
                this.wsAuthedClients.indexOf(client),
                1,
              ),
            )

            client.send(
              JSON.stringify({
                type: 'meta::connect',
                payload: connectPayload(),
              }),
            )
          }
        } catch (e) {
          client.close(401)
        }
      })
    })
  }

  public readonly server: WebSocketServer
  public readonly wsAuthedClients: WebSocket[] = []

  broadcast(type: string, payload: unknown): void {
    this.wsAuthedClients.forEach((c) =>
      c.send(
        JSON.stringify({
          type,
          payload,
        }),
      ),
    )
  }

  stop(): void {
    this.server.close()
  }
}

export const wsRouterServer: RouterServer<WebSocketIncomeRouterServerConfig> = {
  createServer: (resolveRoute, config) => {
    return new WebsocketRouterServerInstance(resolveRoute, config)
  },
}
