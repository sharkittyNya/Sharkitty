import type { Message, MessageSendPayload, WsPackage } from '@chronocat/red'
import { MsgType } from '@chronocat/red'
import { ipcMain } from 'electron'
import { randomBytes } from 'node:crypto'
import type { PathLike } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import toSource from 'tosource'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'

declare const __DEFINE_CHRONO_VERSION__: string
declare const authData: unknown

type Uuid = string | number

interface IpcEvent {
  eventName: string
  callbackId: Uuid
}

type Detail = [
  {
    cmdName: string
    payload: unknown
  },
]

interface ListenerData {
  Full: [unknown, IpcEvent, unknown]
  EventName: string
  CmdName: string
  Payload: unknown
  Request: unknown
}

interface Context {
  responseMap: Record<
    Uuid,
    {
      resolved?: Detail
    }
  >
  requestMap: Record<Uuid, unknown>
  requestCallbackMap: Record<Uuid, (...args: unknown[]) => void>
}

interface MemoryStoreItem {
  args: unknown[]
  expires: number
}

class MemoryStore {
  #data: Record<string, MemoryStoreItem> = {}

  get(key: string, cb: (item: MemoryStoreItem | undefined) => void) {
    cb(this.#data[key])
  }

  set(key: string, val: MemoryStoreItem, cb: () => void) {
    this.#data[key] = val
    cb()
  }

  clear(cb: () => void) {
    this.#data = {}
    cb()
  }
}

function memoize(target: (...args: unknown[]) => unknown) {
  const expire = 30000
  const id = Math.floor(Math.random() * 100000000).toString(36)
  const store = new MemoryStore()

  function wrapper() {
    return function (this: unknown, ...rawArgs: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this
      const args = rawArgs.slice()
      const cb = args.pop() as (...args: unknown[]) => void
      const hash = id + '=' + toSource(args)

      store.get(hash, function (cached) {
        if (cached && (!cached.expires || cached.expires >= Date.now()))
          return cb.apply(self, cached.args)
        args.push(function (this: unknown, ...rawArgs: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const self = this
          const cbargs = rawArgs.slice()
          store.set(
            hash,
            {
              args: cbargs,
              expires: Date.now() + expire,
            },
            function () {
              cb.apply(self, cbargs)
            },
          )
        })

        target.apply(target, args)
      })
    }
  }

  return wrapper()
}

const exists = async (path: PathLike) => {
  try {
    await stat(path)
  } catch (_) {
    return false
  }
  return true
}

const filterMessage = (message: MessageSendPayload | Message) =>
  'peer' in message
    ? !message.elements.some((x) => x.walletElement || x.arkElement)
    : !(message.msgType === MsgType.Ark || message.msgType === MsgType.Wallet)

const initToken = async () => {
  const path = join(
    process.env['APPDATA'] || homedir(),
    'BetterUniverse/QQNT/RED_PROTOCOL_TOKEN',
  )
  try {
    if (await exists(path)) return (await readFile(path, 'utf-8')).trim()
  } catch (e) {
    // Ignore
  }
  const generatedToken = randomBytes(32).toString('hex')
  await writeFile(path, generatedToken)
  return generatedToken
}

const generateUUID = () => {
  let d = new Date().getTime()
  d += performance.now()

  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

const packetPreset = {
  atTinyUid: '',
  elementId: '',
  msgId: '0',
  chatType: 1,
  guildId: '',
  peerUid: '',
  peerUin: '',
  elementType: 1,
  content: '',
  atUid: '',
  atNtUid: '',
  atType: 0,
  extBufForUI: '',
  fileName: '',
  fileSize: '',
  fileSubId: '',
  fileUuid: '',
  md5HexStr: '',
  original: true,
  picHeight: 0,
  picWidth: 0,
  picType: 0,
  picSubType: 0,
  sourcePath: '',
  summary: '',
  thumbFileSize: 0,
}

const makeFullPacket = (obj: Record<string, unknown>) => {
  const traverse = (obj: Record<string, unknown>) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key] as Record<string, unknown>)
      } else {
        for (const key in packetPreset) {
          obj[key] ??= packetPreset[key as keyof typeof packetPreset]
        }
      }
    }
  }

  // 开始遍历
  traverse(obj)

  return obj
}

const initInvoke =
  (ctx: Context) =>
  async (channel: string, evtName: unknown, ...args: unknown[]) => {
    const uuid = generateUUID()
    const result = await Promise.race([
      new Promise((_, reject) => setTimeout(() => reject(), 5000)),
      new Promise((resolve) => {
        ctx.requestCallbackMap[uuid] = resolve
        ipcMain.emit(
          channel,
          {
            sender: {
              send: (...args: [string, IpcEvent, Detail]) => {
                resolve(args)
              },
              __CHRONO_HOOKED__: true,
            },
          },
          { type: 'request', callbackId: uuid, eventName: evtName },
          args,
        )
      }),
    ])

    delete ctx.requestCallbackMap[uuid]

    return result
  }

type Invoke = ReturnType<typeof initInvoke>

const initListener = (
  ctx: Context,
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
          Request: ctx.requestMap[evt.callbackId],
        })

        send.call(this, channel, evt, detail)

        if (evt.callbackId) {
          const uuid = evt.callbackId
          if (ctx.requestCallbackMap[uuid])
            ctx.requestCallbackMap[uuid]?.call(evt, detail)

          if (ctx.responseMap[evt.callbackId])
            ctx.responseMap[evt.callbackId]!.resolved = detail
        }
        delete ctx.requestMap[evt.callbackId]
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
    ctx.responseMap[p1?.callbackId] ??= {}
    ctx.requestMap[p1?.callbackId] = ipcInfo

    return false
  }

  return () => {
    ipcMain.emit = emit
  }
}

const initUixCache = (invoke: Invoke) => {
  const map: Record<string, string> = {}

  const enumerateAll = (
    obj: object,
  ): [string, unknown, Record<string, unknown>][] => {
    const entries: [string, unknown, Record<string, unknown>][] = []
    const enumerate = (obj: Record<string, unknown>) => {
      for (const key in obj) {
        if (obj[key] instanceof Map) continue
        if (obj[key] instanceof Object)
          enumerate(obj[key] as Record<string, unknown>)
        else entries.push([key, obj[key], obj])
      }
    }
    enumerate(obj as Record<string, unknown>)
    return entries
  }

  const genCorrespondingName = (name: string): string | undefined => {
    const keyMap: Record<string, string> = {
      uid: 'uin',
      uin: 'uid',
      Uid: 'Uin',
      Uin: 'Uid',
    }

    for (const key in keyMap) {
      if (name.endsWith(key)) {
        const k = name.slice(0, -key.length)
        return k + keyMap[key]
      }
    }
    return undefined
  }

  const addToMap = (a: string, b: string) => {
    if (parseInt(a) === 0 || parseInt(b) === 0) return
    map[a] = b
    map[b] = a
  }

  const performSearch = memoize(async (contextGroup) => {
    const scene = await invoke(
      'IPC_UP_2',
      'ns-ntApi-2',
      'nodeIKernelGroupService/createMemberListScene',
      {
        groupCode: contextGroup,
        scene: 'groupMemberList_MainWindow',
      },
    )

    await invoke(
      'IPC_UP_2',
      'ns-ntApi-2',
      'nodeIKernelGroupService/searchMember',
      {
        sceneId: scene,
        keyword: contextGroup,
      },
    )

    await invoke(
      'IPC_UP_2',
      'ns-ntApi-2',
      'nodeIKernelGroupService/destroyMemberListScene',
      {
        sceneId: scene,
      },
    )
  })

  const cacheObject = (object: Record<string, unknown>) => {
    for (const [key, value, obj] of enumerateAll(object)) {
      const cKey = genCorrespondingName(key)
      if (cKey && obj[cKey]) {
        if (
          parseInt(obj[cKey] as string) == 0 ||
          !obj[cKey] ||
          (obj[cKey] as string).includes('*') ||
          map[value as string]
        )
          continue

        addToMap(value as string, obj[cKey] as string)
      }
    }
  }

  const preprocessObject = async (
    origin: object,
    { contextGroup = -1 } = {},
  ): Promise<object> => {
    const eAll = enumerateAll(origin)

    for (const [key, value, obj] of eAll) {
      const cKey = genCorrespondingName(key)
      if (cKey && !obj[cKey]) {
        if (key.toLocaleLowerCase().endsWith('uin')) {
          if (contextGroup !== -1) performSearch(contextGroup, value)
        }

        if (key === 'atNtUid') {
          performSearch(
            contextGroup,
            (
              obj as {
                content: string
              }
            ).content.slice(1),
          )
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 80))

    for (const [key, value, obj] of eAll) {
      const cKey = genCorrespondingName(key)
      if (key === 'peerUin' && obj['chatType'] === 2) obj['peerUid'] = value
      if (key === 'peerUid' && !(value as string).startsWith('u_'))
        obj['peerUin'] = value
      if (cKey && !obj[cKey] && map[value as string])
        obj[cKey] = map[value as string]
    }
    return origin
  }

  const preprocessArrayOfUix = (arr: string[]) => arr.map((v) => map[v] ?? v)

  return {
    cacheObject,
    preprocessObject,
    addToMap,
    preprocessArrayOfUix,
    map,
  }
}

export const chronocat = async () => {
  const ctx: Context = {
    responseMap: {},
    requestMap: {},
    requestCallbackMap: {},
  }

  const token = await initToken()
  const invoke = initInvoke(ctx)
  const uixCache = initUixCache(invoke)

  const wsClientListener = (raw: Buffer) =>
    void (async () => {
      const { type, payload } = JSON.parse(
        raw.toString(),
      ) as WsPackage<MessageSendPayload>

      switch (type) {
        case 'message::send': {
          if (!filterMessage(payload)) return

          makeFullPacket(payload as unknown as Record<string, unknown>)

          void invoke(
            'IPC_UP_2',
            'ns-ntApi-2',
            'nodeIKernelMsgService/sendMsg',
            {
              msgId: '0',
              peer: await uixCache.preprocessObject(payload.peer),
              msgElements: await uixCache.preprocessObject(payload.elements, {
                contextGroup:
                  payload.peer.chatType === 2
                    ? Number(payload.peer.peerUin)
                    : undefined,
              }),
            },
            null,
          )

          return
        }
      }
    })()

  const httpServer = createServer((_req, res) => {
    res.writeHead(404)
    res.end('404 not found')
  })

  const wsServer = new WebSocketServer({
    server: httpServer,
  })

  const wsClients: WebSocket[] = []
  const send = (type: string, payload: unknown) =>
    wsClients.forEach((c) =>
      c.send(
        JSON.stringify({
          type,
          payload,
        }),
      ),
    )

  const dispatch = async ({ CmdName, Payload }: ListenerData) => {
    try {
      uixCache.cacheObject(Payload as Record<string, unknown>)
    } catch (e: unknown) {
      // Ignore
    }

    switch (CmdName) {
      case 'nodeIKernelMsgListener/onRecvMsg': {
        send(
          'message::recv',
          await Promise.all(
            (
              Payload as {
                msgList: Message[]
              }
            ).msgList
              .filter(filterMessage)
              .map(async (msg) => await uixCache.preprocessObject(msg)),
          ),
        )
        return
      }
    }
  }

  const disposeListener = initListener(ctx, dispatch)

  wsServer.on('connection', (wsClient) => {
    wsClient.once('message', (raw: Buffer) => {
      try {
        const { type, payload } = JSON.parse(raw.toString()) as {
          type: string
          payload: {
            token: string
          }
        }
        if (type !== 'meta::connect') throw undefined
        if (payload.token !== token) throw undefined

        wsClient.send(
          JSON.stringify({
            type: 'meta::connect',
            payload: {
              version: __DEFINE_CHRONO_VERSION__,
              name: 'chronocat',
              authData,
            },
          }),
        )

        wsClients.push(wsClient)
        wsClient.on('message', wsClientListener)
        wsClient.on('disconnect', () =>
          wsClients.splice(wsClients.indexOf(wsClient), 1),
        )
      } catch (e: unknown) {
        wsClient.close()
      }
    })
  })

  httpServer.listen(16530)

  return () => {
    httpServer.close()
    disposeListener()
  }
}
