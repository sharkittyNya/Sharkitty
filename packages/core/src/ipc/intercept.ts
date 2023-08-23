import { ipcMain } from 'electron'
import type { Detail, IpcEvent, ListenerData } from '../types'
import { requestMap, responseMap, requestCallbackMap } from './globalVars'

export const initListener = (
  listener: (data: ListenerData) => void | Promise<void>,
) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const emit = ipcMain.emit

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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            requestCallbackMap[uuid]?.call(evt, detail)
          }

          if (responseMap[evt.callbackId])
            responseMap[evt.callbackId]!.resolved = detail
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
    }

    emit.call(this, eventName, ...p)

    if (p1?.eventName?.includes('Log')) return false
    responseMap[p1?.callbackId] ??= {}
    requestMap[p1?.callbackId] = ipcInfo

    return false
  }

  return () => {
    ipcMain.emit = emit
  }
}
