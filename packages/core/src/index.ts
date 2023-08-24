import type {
  Group,
  Message,
  MessageSendPayload,
  Profile,
  WsPackage,
} from '@chronocat/red'
import { MsgType } from '@chronocat/red'
import { randomBytes } from 'node:crypto'
import type { PathLike } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import { sendMsg } from './ipc/definitions/msgService'
import {
  friendMap,
  groupMap,
  richMediaDownloadMap,
  selfProfile,
} from './ipc/globalVars'
import { initListener } from './ipc/intercept'
import { routes } from './routes'
import type { ListenerData } from './types'
import { uixCache } from './uixCache'
import { makeFullPacket } from './utils/packet-helper'

declare const __DEFINE_CHRONO_VERSION__: string
declare const authData: {
  uid: string
}

const exists = async (path: PathLike) => {
  try {
    await stat(path)
  } catch (e) {
    return false
  }
  return true
}

const filterMessage = (message: MessageSendPayload | Message) =>
  'peer' in message
    ? !message.elements.some((x) => x.walletElement || x.arkElement)
    : !(message.msgType === MsgType.Ark || message.msgType === MsgType.Wallet)

const initToken = async (baseDir: string) => {
  const path = join(baseDir, 'RED_PROTOCOL_TOKEN')
  try {
    if (await exists(path)) return (await readFile(path, 'utf-8')).trim()
  } catch (e) {
    // Ignore
  }
  const generatedToken = randomBytes(32).toString('hex')
  await writeFile(path, generatedToken)
  return generatedToken
}

export const chronocat = async () => {
  const baseDir = join(
    process.env['APPDATA'] || homedir(),
    'BetterUniverse/QQNT',
  )

  const token = await initToken(baseDir)

  const wsClientListener = (raw: Buffer) =>
    void (async () => {
      const { type, payload } = JSON.parse(
        raw.toString(),
      ) as WsPackage<MessageSendPayload>

      switch (type) {
        case 'message::send': {
          if (!filterMessage(payload)) return

          makeFullPacket(payload as unknown as Record<string, unknown>)

          await sendMsg({
            msgId: '0',
            peer: await uixCache.preprocessObject(payload.peer),
            msgElements: await uixCache.preprocessObject(payload.elements, {
              contextGroup:
                payload.peer.chatType === 2
                  ? Number(payload.peer.peerUin)
                  : undefined,
            }),
          })

          return
        }
      }
    })()

  const httpServer = createServer((req, res) => {
    if (!req.url) return
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (
      req.headers.authorization?.slice(0, 7) !== 'Bearer ' ||
      req.headers.authorization.slice(7) !== token
    ) {
      res.writeHead(401)
      res.end('401 unauthorized')
    }

    const getBody = () =>
      new Promise((resolve, reject) => {
        let body = ''
        req.on('data', (chunk: { toString: () => string }) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (error) {
            reject(error)
          }
        })
        req.on('error', (error: unknown) => {
          reject(error)
        })
      })

    const ctx = {
      baseDir,
      uixCache,
      req,
      res,
      getBody,
    }

    const route =
      routes[url.pathname.replace('/api/', '') as keyof typeof routes]
    if (route)
      void route(ctx)
        .then((result) => {
          res.writeHead(200)
          res.end(result)
        })
        .catch((_error) => {
          res.writeHead(500)
          res.end()
        })
    else {
      res.writeHead(404)
      res.end('404 not found')
    }
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
    } catch (e) {
      // Ignore
    }

    switch (CmdName) {
      case 'nodeIKernelMsgListener/onRecvMsg': {
        const payload = Payload as {
          msgList: Message[]
        }

        send(
          'message::recv',
          await Promise.all(
            payload.msgList
              .filter(filterMessage)
              .map(async (msg) => await uixCache.preprocessObject(msg)),
          ),
        )
        return
      }

      case 'nodeIKernelProfileListener/onProfileSimpleChanged':
      case 'nodeIKernelGroupListener/onSearchMemberChange':
      case 'nodeIKernelGroupService/getNextMemberList': {
        const payload = Payload as {
          profiles: [
            string,
            {
              uin: string
            },
          ][] & {
            get: (uid: string) => Profile
          }
          infos: [
            string,
            {
              uin: string
            },
          ][]
        }

        if (payload.profiles.get(authData.uid))
          selfProfile.value = payload.profiles.get(authData.uid)

        const profile = payload.profiles ?? payload.infos
        for (const [uid, { uin }] of profile) uixCache.addToMap(uid, uin)
        return
      }

      case 'nodeIKernelMsgListener/onRichMediaDownloadComplete': {
        const payload = Payload as {
          notifyInfo: {
            msgId: string
            msgElementId: string
            filePath: string
          }
        }

        const downloadId = `${payload.notifyInfo.msgId}::${payload.notifyInfo.msgElementId}`
        if (richMediaDownloadMap[downloadId]) {
          richMediaDownloadMap[downloadId]!(payload.notifyInfo.filePath)
          delete richMediaDownloadMap[downloadId]
        }
        return
      }

      case 'nodeIKernelGroupListener/onGroupListUpdate': {
        const payload = Payload as {
          groupList: Group[]
        }

        for (const group of payload.groupList) groupMap[group.groupCode] = group
        return
      }

      case 'nodeIKernelBuddyListener/onBuddyListChange': {
        const payload = Payload as {
          data: {
            categoryName: string
            buddyList: {
              category: string
              uin: string
            }[]
          }[]
        }

        for (const category of payload.data) {
          for (const buddy of category.buddyList) {
            buddy.category = category.categoryName
            friendMap[buddy.uin] = buddy
          }
        }
        return
      }
    }
  }

  const disposeListener = initListener(dispatch)

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
      } catch (e) {
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
