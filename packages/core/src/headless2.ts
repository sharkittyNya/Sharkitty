import type { BrowserWindowConstructorOptions } from 'electron'
// https://github.com/import-js/eslint-plugin-import/issues/2802
// eslint-disable-next-line import/no-unresolved
import { app, BrowserWindow } from 'electron'
import { EventEmitter } from 'node:events'
import { start } from 'node:repl'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import type { IpcP } from './ipc/types'

declare global {
  // eslint-disable-next-line no-var
  var authData: {
    uid: string
  }

  // eslint-disable-next-line no-var
  var apiMap: Record<string, unknown>

  // eslint-disable-next-line no-var
  var winMap: Map<unknown, unknown>
}

function makeProxy(obj: object, path = ''): object {
  if (typeof obj === 'object' || typeof obj === 'function')
    return new Proxy(obj, {
      get(target, prop) {
        if (prop === '_origin_')
          return (
            (
              obj as {
                _origin_: object
              }
            )._origin_ ?? obj
          )

        const fullPath = path ? `${path}.${String(prop)}` : String(prop)
        const value = target[prop as keyof typeof target]

        if (prop === 'prototype') return value

        if (typeof value === 'function') {
          return makeProxy(value, fullPath)
        } else if (typeof value === 'object' && value !== null) {
          return makeProxy(value, fullPath)
        }

        console.log(`[GET] ${fullPath}:`, value)

        return value
      },

      apply(target, thisArg, args) {
        const fullPath = path ? `${path}()` : '()'

        console.log(`[CALL] ${fullPath}`, args)

        const ret = makeProxy(
          (target as (...p: unknown[]) => object).apply(
            (
              thisArg as {
                _origin_: object
              }
            )._origin_,
            args,
          ),
          fullPath,
        )

        global.apiMap[fullPath] = ret
        console.log(`     - ${fullPath}`, ret)
        return ret
      },
    })

  return obj
}

export const initHeadless2 = () => {
  try {
    start('> ')

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

    let handleClearWindowsTimer: NodeJS.Timeout | undefined = undefined
    let flag = false

    global.apiMap = {}

    setInterval(() => console.log(global.apiMap), 5000)

    const eventTargets = []

    // hook event target
    const originCtor = EventEmitter.prototype.constructor
    EventTarget.prototype.constructor = function (...args: unknown[]) {
      console.log('[headless] EventTarget.constructor', args)

      const ret = originCtor.apply(this, args) as unknown

      eventTargets.push(ret)
      console.log(ret)
      return ret
    }

    Map.prototype.forEach = function (cb) {
      // console.log(this, this.entries().next()?.[1]?.windowType, this.entries().next())
      if (
        !global.winMap &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.entries().next()?.value[1]?.ipcLinkServerManager
      ) {
        global.winMap = this
        setInterval(() => {
          // console.log(winMap)
        }, 1000)
      }

      Map.prototype.forEach.call(this, (r, p2, p3) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        r.shutdown = () => {
          console.log('[headless] not shutting down', r)
        }

        cb(makeProxy(r as object, 'bwMapFor'), p2, p3)
      })
    }

    const FakeBrowserWindow = new Proxy(BrowserWindow, {
      construct(_target, args: [BrowserWindowConstructorOptions]) {
        args[0].webPreferences = {
          ...args[0].webPreferences,
          // offscreen: true,
        }

        // args[0].width = 3
        // args[0].height = 3
        console.log('[headless] ConstructBW', args)

        if (!args[0].title && !handleClearWindowsTimer) {
          app.removeAllListeners('window-all-closed')

          handleClearWindowsTimer = setInterval(() => {
            if (!globalThis.authData) return

            clearInterval(handleClearWindowsTimer)
            setTimeout(() => {
              console.log('Closing!!!')
              // clear all listeners
              // for (let i in [
              //     ...require('electron').ipcMain._events,
              //     ...require('electron').app._events,

              // ]) {
              //     ipcMain.removeAllListeners(i)
              // }

              BrowserWindow.getAllWindows().forEach((v) => {
                try {
                  for (const evt in (
                    v as unknown as {
                      _events: Record<string, (() => void)[]>
                    }
                  )._events)
                    v.removeAllListeners(evt)

                  // @ts-expect-error BaseWindow 没有 dts
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
                  require('electron').BaseWindow.prototype.destroy.call(v)
                } catch (e) {
                  console.log('headless2: destroy failed: ', e)
                }
              })

              // const setTimeo = globalThis.setTimeout
              // globalThis.setTimeout = (...args) => {
              //     console.log('[headless] setTimeout', args, new Error().stack)
              //     return setTimeo.apply(globalThis, args)
              // }
              flag = true
            }, 4000)
          }, 3000)
        }

        type BWKeys = Exclude<keyof BrowserWindow, 'id' | 'webContents'>
        type BWFunctions = BrowserWindow[BWKeys]

        const win = new BrowserWindow(...args)
        const winOriginMethods = {} as Record<BWKeys, BWFunctions>

        for (const i in win) {
          const ii = i as BWKeys

          if (typeof win[ii] === 'function') {
            winOriginMethods[ii] = (win[ii] as () => void).bind(win)

            win[ii] = ((...args: unknown[]) => {
              console.log('[headless] win', ii, args)
              if (ii === 'isDestroyed') {
                console.log(new Error().stack)
                return false
              }

              return (
                winOriginMethods[ii] as (...p: unknown[]) => unknown
              ).apply(win, args)
            }) as never
          }
        }

        // win.webContents.setFrameRate(1)
        // win.webContents.on('paint', (event, dirty, image) => { })
        // win.show = () => {
        //     console.log('[headless] Not showing window')
        // }

        const emit = win.webContents.emit.bind(win.webContents)

        win.webContents.emit = (eventName: string, ...p: IpcP) => {
          const p0 = p[0]

          const send = p0.sender?.send?.bind(p0?.sender)

          if (flag) return false

          if (send && !p0.sender.__CHRONO_HOOKED__) {
            p0.sender.send = (...args2) => {
              if (flag) return

              return send.call(p0.sender, ...args2)
            }
            p0.sender.__CHRONO_HOOKED__ = true
          }

          return emit.call(win.webContents, eventName, ...p)
        }

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
        return makeProxy(
          {
            ...originLoad(request, parent, isMain),
            BrowserWindow: FakeBrowserWindow,
          },
          'electron',
        )
      }

      return originLoad(request, parent, isMain)
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    require('module')._load = newLoad
  } catch (e) {
    console.log('headless: ', e)
  }
}
