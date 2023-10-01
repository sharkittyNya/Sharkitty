import { resolveRouteLogin, routerLogin } from './router'
// eslint-disable-next-line import/no-unresolved
import type { WebContents } from 'electron'
// eslint-disable-next-line import/no-unresolved
import { app, BrowserWindow, ipcMain } from 'electron'
import { HeaderAuthorizer } from './server/authorizer'
import { httpRouterServer } from './server/httpIncomeRouterServer'
import type { IpcEvent } from './types'
import { getAuthData } from './utils/authData'

interface QuickLoginAccount {
  name: string
  id: string
}

interface LoginState {
  qrcode?: string | null
  quickLoginAccounts?: QuickLoginAccount[] | null
}

const loginState: LoginState = {}

export const initLoginService = (token: string) => {
  if (!app.commandLine.hasSwitch('login-service')) return
  // --login-service=host:port or --login-service=port
  const loginService =
    app.commandLine.getSwitchValue('login-service') || '16340'
  let [host, port] = loginService.split(':')
  if (!port) {
    port = host
    host = '0.0.0.0'
  }

  console.warn(
    "\n\n\n\n|-------------- Login Service --------------|\n   Chronocat's login service\n",
    `\n\tRunning on: ${host}:${port}\n\tToken: ${token}`,
    '\n\n|--------------------------------------------|\n\n\n\n',
  )

  const server = httpRouterServer.createServer(resolveRouteLogin, {
    authorizer: HeaderAuthorizer(token),
    rootPath: '/login',
    port: parseInt(port),
    host,
    cors: 'all',
  })

  app.once('browser-window-created', (_event, window) => {
    window.webContents.on('did-finish-load', () => {
      runScriptInRenderer(
        window.webContents,
        `
      function waitForFunction(y, m = 100) { return new Promise(s => {
        let e;
        const check = () => { let d = y(); d && (clearInterval(e), s(d)) }
        e = setInterval(check, m)
      }) }
      function waitForElement(y, m = 100) { return waitForFunction(() => document.querySelector(y), m) }

      !(async()=>{
        const sleep = (ms)=>new Promise(rs=>setTimeout(rs, ms))
        await sleep(100)

        const autoLoginPanel = document.querySelector('.auto-login')
        const scanPanel = document.querySelector('.scan')

        const moreAccountBtn = document.querySelector('[aria-label="更多账号"]')
        const newAccountBtn = document.querySelector('[aria-label="添加账号"]')


        const getUinByAvatarPath = path=>path.split('/Data/')[1].split('/')[0]

        const sendMessageBack = (type, data)=>{
          ipcRenderer.send('chronocat', JSON.parse(JSON.stringify({type, data})))
        }

        let qrcodeRefreshHandler = null
        window.getQRCode = async ()=>{
          newAccountBtn.click()
          const qrcodeElement = await waitForElement('.qr-code-img > img')
          const qrcode = qrcodeElement.src
          sendMessageBack('qrcode', qrcode)

          if(qrcodeRefreshHandler) clearInterval(qrcodeRefreshHandler)
          qrcodeRefreshHandler = setInterval(async ()=>{
            const refreshBtn = document.querySelector('.refresh')?.firstElementChild
            if(refreshBtn) {
              refreshBtn.click()
              await sleep(100)
            }

            const qrcodeElement = await waitForElement('.qr-code-img > img')
            sendMessageBack('qrcode', qrcodeElement.src)
          }, 400)
        }

        if(moreAccountBtn) {
          moreAccountBtn.click()
          await sleep(100)
          const loginList = [...(await waitForElement('.manage-account')).children].map(v=>({
            name: v.querySelector('.process-txt').innerText,
            id: getUinByAvatarPath(v.querySelector('.avatar').style.backgroundImage),
            login: ()=>v.firstElementChild.click()
          }))

          window.quickLogin = (id)=>{
            const account = loginList.find(v=>v.id===id)
            if(account) account.login()
            else sendMessageBack('quickloginError', 'account not found')
          }

          sendMessageBack('quickloginList', loginList)
        } else {
          window.quickLogin = ()=>{
            document.evaluate('//span[text()="登录"]', document).iterateNext().parentElement.parentElement.click()
          }

          sendMessageBack('quickloginList', [
            {
              name: document.querySelector('.name').innerText,
              id: getUinByAvatarPath(document.querySelector('.avatar').style.backgroundImage),
            }
          ])
        }
      })()

      `,
      )
    })
  })

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
        }

        if (type === 'quickloginList') {
          loginState.quickLoginAccounts = data
          loginState.qrcode = null
        } else if (type === 'qrcode') {
          loginState.qrcode = data
          loginState.quickLoginAccounts = null
        } else if (type === 'quickloginError') {
          loginState.quickLoginAccounts = null
          loginState.qrcode = null
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
