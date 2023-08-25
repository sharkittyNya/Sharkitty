import type { IncomingMessage, Server } from 'node:http'
import { createServer } from 'node:http'
import type {
  ConfigOf,
  RouteResolver,
  RouterServer,
  RouterServerCommonConfig,
  RouterServerInstance,
} from './abstract'

interface HttpIncomeRouterServerConfig
  extends RouterServerCommonConfig<IncomingMessage> {
  rootPath: string
  port: number
}

export class HttpRouterServerInstance implements RouterServerInstance {
  constructor(
    resolveRoute: RouteResolver,
    {
      authorizer,
      rootPath = '/api/',
      port,
    }: ConfigOf<HttpIncomeRouterServerConfig>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server = createServer(async (req, res) => {
      if (!req.url) {
        res.writeHead(400)
        res.end('404 bad request')
        return
      }
      const url = new URL(req.url, `http://${req.headers.host}`)

      if (!url.pathname.startsWith(rootPath)) {
        res.writeHead(404)
        res.end('404 not found')
        return
      }

      const path = url.pathname
        .slice(rootPath.length)
        .split('/')
        .filter((v) => v)

      const route = resolveRoute(path)
      if (route) {
        if (route.options.requireAuthorize && !(await authorizer(req))) {
          res.writeHead(401)
          res.end('401 unauthorized')
        }

        const readBodyToBuffer = (req: IncomingMessage) => {
          const chunks: Buffer[] = []
          return new Promise<Buffer>((resolve, reject) => {
            req.on('data', (chunk) => {
              chunks.push(chunk as Buffer)
            })
            req.on('end', () => {
              resolve(Buffer.concat(chunks))
            })
            req.on('error', () => {
              reject()
            })
          })
        }

        const readBodyToString = async (req: IncomingMessage) =>
          (await readBodyToBuffer(req)).toString('utf-8')

        let body: unknown
        if (route.options.body === 'binary') {
          body = await readBodyToBuffer(req)
        } else if (route.options.body === 'json') {
          body = JSON.parse(await readBodyToString(req))
        } else if (route.options.body === 'text') {
          body = await readBodyToString(req)
        }

        const ctx = {
          http: route.options.httpOnly && {
            req,
            res,
          },
          body,
        }

        route.handler(ctx)
      } else {
        res.writeHead(404)
        res.end('404 not found')
      }
    })

    this.server.listen(port)
  }

  public readonly server: Server

  stop(): void {
    this.server.close()
  }
}

export const httpRouterServer: RouterServer<HttpIncomeRouterServerConfig> = {
  createServer: (resolveRoute, config) => {
    return new HttpRouterServerInstance(resolveRoute, config)
  },
}
