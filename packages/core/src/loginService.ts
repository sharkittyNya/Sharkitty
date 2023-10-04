import { resolveRouteLogin, routerLogin } from './router'
// eslint-disable-next-line import/no-unresolved
import type { WebContents } from 'electron'
// eslint-disable-next-line import/no-unresolved
import { app, BrowserWindow, ipcMain } from 'electron'
import index from '../static/login.html'
import loginJs from '../static/login.js.txt'
import { HeaderAuthorizer } from './server/authorizer'
import { httpRouterServer } from './server/httpIncomeRouterServer'
import type { IpcEvent } from './types'
import { getAuthData } from './utils/authData'
import { sleep } from './utils/time'
import { generateToken } from './utils/token'

interface QuickLoginAccount {
  name: string
  id: string
}

interface LoginState {
  qrcode?: string | null
  quickLoginAccounts?: QuickLoginAccount[] | null
}

const loginState: LoginState = {}

export const initLoginService = () => {
  const listen =
    app.commandLine.getSwitchValue('chrono-admin-listen') ||
    process.env['CHRONO_ADMIN_LISTEN'] ||
    '0.0.0.0:16340'

  const token =
    app.commandLine.getSwitchValue('chrono-admin-token') ||
    process.env['CHRONO_ADMIN_TOKEN'] ||
    generateToken()

  let [host, port] = listen.split(':')
  if (!port) {
    port = host
    host = '0.0.0.0'
  }

  console.warn(
    `访问此链接以登录：\nhttp://${host}:${port}/#${host}:${port}@${token}`,
  )

  const server = httpRouterServer.createServer(resolveRouteLogin, {
    authorizer: HeaderAuthorizer(token),
    rootPath: '/login',
    port: parseInt(port),
    host,
    cors: 'all',
  })

  app.on('browser-window-created', (_event, window) => {
    window.webContents.on('did-finish-load', () => {
      runScriptInRenderer(window.webContents, loginJs)
    })
  })

  void sleep(3000).then(() => runScriptInAllRenderers(loginJs))

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originEmit = ipcMain.emit.bind(ipcMain)
  ipcMain.emit = (eventName: string | symbol, ...p: unknown[]) => {
    try {
      const p1 = p?.[1] as IpcEvent
      const p2 = p?.[2] as unknown[] | undefined

      if (p1?.eventName === 'chronocat') {
        const { type, data } = p2![0] as {
          type: 'quickloginList'
          data: QuickLoginAccount[]
        } & {
          type: 'qrcode'
          data: string
        } & {
          type: 'quickloginError'
        } & {
          type: 'error'
          data: unknown
        }

        switch (type) {
          case 'quickloginList': {
            loginState.quickLoginAccounts = data
            loginState.qrcode = null
            break
          }
          case 'qrcode': {
            loginState.qrcode = data
            loginState.quickLoginAccounts = null
            break
          }
          case 'quickloginError': {
            loginState.quickLoginAccounts = null
            loginState.qrcode = null
            break
          }
          case 'error': {
            console.log('quickLogin error: ', data)
            break
          }
        }

        return true
      }
    } catch (e) {
      console.error(e)
    }

    return originEmit(eventName, ...p)
  }

  void getAuthData().then(() => {
    server.stop()
    console.warn('Chronocat login service stopped due to authorization')
  })
}

const runScriptInRenderer = (
  renderer: BrowserWindow | WebContents,
  script: string,
) =>
  // use javascript: protocol to run script in renderer
  void renderer.loadURL(`javascript:eval(decodeURI(\`${encodeURI(script)}\`))`)

const runScriptInAllRenderers = (script: string) => {
  for (const renderer of BrowserWindow.getAllWindows()) {
    runScriptInRenderer(renderer, script)
  }
}

routerLogin.available.$requireAuthorize(false)(() => 'true')

routerLogin.states(() => loginState)

routerLogin.qrcode(() => {
  if (!loginState) return null
  if (loginState.qrcode) return loginState.qrcode
  runScriptInAllRenderers('getQRCode()')
  return 'pending'
})

routerLogin.quickLogin.$body('json')(({ body }) => {
  const { id } = body as { id: string }
  runScriptInAllRenderers(`quickLogin('${parseInt(id)}')`)
})

routerLogin.$requireAuthorize(false).$httpOnly('GET')(({ http }) => {
  http.res.writeHead(200, {
    'Content-Type': 'text/html; charset=UTF-8',
    'Cache-Control': 'no-cache',
    'Content-Length': index.byteLength,
  })
  http.res.end(index)
})
