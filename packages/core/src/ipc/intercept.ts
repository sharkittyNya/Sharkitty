// https://github.com/import-js/eslint-plugin-import/issues/2802
// eslint-disable-next-line import/no-unresolved
import { ipcMain } from 'electron'
import type { Detail, IpcEvent, IpcInfo, ListenerData } from '../types'
import { requestCallbackMap, requestMap, responseMap } from './globalVars'

export const enableInterceptLog = {
  enable: false,
}

export const initListener = (
  listener: (data: ListenerData) => void | Promise<void>,
) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const emit = ipcMain.emit

  let i = 1

  ipcMain.emit = function (eventName: string | symbol, ...p: unknown[]) {
    const p0 = p[0] as {
      sender: {
        send: (channel: string, evt: IpcEvent, detail: Detail) => void
        __CHRONO_HOOKED__: boolean
      }
    }
    const p1 = p?.[1] as IpcEvent
    const p2 = p?.[2] as unknown[] | undefined

    const sender = p0.sender
    if (!sender.__CHRONO_HOOKED__) {
      const send = sender.send
      sender.__CHRONO_HOOKED__ = true

      sender.send = function (channel, evt, detail) {
        void listener({
          Full: [channel, evt, detail],
          EventName: evt.eventName,
          CmdName: detail?.[0]?.cmdName,
          Payload: detail?.[0]?.payload,
          Request: requestMap[evt.callbackId],
        })

        send.call(this, channel, evt, detail)

        if (evt.callbackId) {
          const uuid = evt.callbackId

          if (requestCallbackMap[uuid]) {
            requestCallbackMap[uuid]?.call(evt, detail)
          }

          if (responseMap[evt.callbackId])
            responseMap[evt.callbackId]!.resolved = detail

          if (enableInterceptLog.enable)
            console.log(
              `%c${i++}%cChronocat%cResponse%c${
                requestMap[evt.callbackId]!.EventName
              }/${requestMap[evt.callbackId]!.Method}`,
              'background:#6ff;color:black;padding: 2px 4px;',
              'background:#111;color:white;padding: 2px 8px;',
              'background:#292;color:white;padding: 2px 8px;',
              'background:#555;color:white;padding: 2px 8px;',
              requestMap[evt.callbackId]!.Args?.[1],
              detail,
            )
        } else {
          if (enableInterceptLog.enable)
            if (evt.eventName !== 'BQQNT_IPC_inspector:log')
              console.log(
                `%c${i++}%cChronocat%cEvent%c${evt.eventName}/${
                  detail[0]!.cmdName
                }`,
                'background:#6ff;color:black;padding: 2px 4px;',
                'background:#111;color:white;padding: 2px 8px;',
                'background:#229;color:white;padding: 2px 8px;',
                'background:#555;color:white;padding: 2px 8px;',
                detail[0]?.payload,
              )
        }
        delete requestMap[evt.callbackId]
      }
    }

    const ipcInfo = {
      Full: p,
      EventName: p1?.eventName,
      Method: p2?.[0],
      Args: p2,
      Channel: eventName,
    } as IpcInfo

    emit.call(this, eventName, ...p)

    if (p1?.eventName?.includes('Log')) return false
    responseMap[p1?.callbackId] ??= {}
    requestMap[p1?.callbackId] = ipcInfo

    // console.debug(
    //   `%c${i++}%cChronocat%cRequest%c${ipcInfo.EventName}/${ipcInfo.Method}`,
    //   'background:#6ff;color:black;padding: 2px 4px;',
    //   'background:#111;color:white;padding: 2px 8px;',
    //   'background:#922;color:white;padding: 2px 8px;',
    //   'background:#555;color:white;padding: 2px 8px;',
    //   ipcInfo.Args?.[1],
    // )

    return false
  }
}
