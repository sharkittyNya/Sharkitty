import type { BrowserWindowConstructorOptions } from 'electron'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
// eslint-disable-next-line import/no-unresolved
import { app, BrowserWindow } from 'electron'

declare global {
  // eslint-disable-next-line no-var
  var authData: {
    uid: string
  }
}

export const initHeadless = () => {
  try {
    setFlagsFromString('--expose_gc')

    // 5 秒一 gc
    const gc = runInNewContext('gc') as () => void

    setInterval(() => {
      gc()
    }, 5000)

    app.quit = () => console.log('Not quitting...')

    app.commandLine.appendSwitch('disable-software-rasterizer')
    app.commandLine.appendSwitch('disable-gpu')

    if (!app.isReady) app.disableHardwareAcceleration()

    setInterval(() => {
      if (!globalThis.authData) return

      app.removeAllListeners('window-all-closed')
      BrowserWindow.getAllWindows().map((v) => {
        v.removeAllListeners('close')
        v.close()
      })
    }, 5000)

    // let handleClearWindowsTimer: NodeJS.Timeout | undefined = undefined

    const FakeBrowserWindow = new Proxy(BrowserWindow, {
      construct(
        _target: typeof BrowserWindow,
        args: [BrowserWindowConstructorOptions],
      ) {
        args[0].webPreferences = {
          ...args[0].webPreferences,
          offscreen: true,
        }

        args[0].width = 3
        args[0].height = 3
        console.log('[headless] ConstructBW', args)

        // if (!args[0].title && !handleClearWindowsTimer) {
        //   app.quit = () => console.log('Not quitting...')

        //   handleClearWindowsTimer = setInterval(() => {
        //     if (!globalThis.authData) return

        //     app.removeAllListeners('window-all-closed')
        //     BrowserWindow.getAllWindows().map((v) => {
        //       v.removeAllListeners('close')
        //       v.close()
        //     })
        //   }, 3000)
        // }

        const win = new BrowserWindow(...args)
        win.webContents.setFrameRate(1)
        win.webContents.on('paint', () => {})
        win.show = () => console.log('[headless] Not showing window')
        return win
      },
    })

    type ModuleLoad = (
      request: string,
      parent: unknown,
      isMain: boolean,
    ) => object

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    const originLoad = require('module')._load as ModuleLoad

    const newLoad: ModuleLoad = (request, parent, isMain) => {
      if (request === 'electron') {
        return {
          ...originLoad(request, parent, isMain),
          BrowserWindow: FakeBrowserWindow,
        }
      }
      return originLoad(request, parent, isMain)
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    require('module')._load = newLoad
  } catch (e) {
    console.log(e)
  }
}
