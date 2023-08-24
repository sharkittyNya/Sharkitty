import type {
  Group,
  GroupGetMemeberListPayload,
  GroupKickPayload,
  GroupMuteEveryonePayload,
  GroupMuteMemberPayload,
  Media,
  Message,
  MessageGetHistoryPayload,
  MessageRecallPayload,
  MessageSendPayload,
  Profile,
  WsPackage,
} from '@chronocat/red'
import { MsgType } from '@chronocat/red'
import busboy from 'busboy'
import { getType } from 'mime/lite'
import { randomBytes, randomFillSync } from 'node:crypto'
import type { PathLike } from 'node:fs'
import { createReadStream, createWriteStream } from 'node:fs'
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import {
  getFileMd5,
  getFileSize,
  getFileType,
  getImageSizeFromPath,
} from './ipc/definitions/fsApi'
import type { MuteMember } from './ipc/definitions/groupService'
import {
  createMemberListScene,
  destroyMemberListScene,
  getNextMemberList,
  kickMember,
  setGroupShutUp,
  setMemberShutUp,
} from './ipc/definitions/groupService'
import {
  downloadRichMedia,
  getMsgsIncludeSelf,
  getRichMediaFilePath,
  recallMsg,
  sendMsg,
} from './ipc/definitions/msgService'
import {
  friendMap,
  groupMap,
  richMediaDownloadMap,
  selfProfile,
} from './ipc/globalVars'
import { initListener } from './ipc/intercept'
import type { Context, ListenerData } from './types'
import { initUixCache } from './uix-cache'
import { detachPromise } from './utils/detach-promise'

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

const manualHandled = Symbol('manualHandled')

const routes = {
  '/getSelfProfile': async ({ req, res }: Context) => {
    if (req.method !== 'GET') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    return selfProfile.value ?? {}
  },

  '/group/getMemberList': async ({ req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const body = (await getBody()) as GroupGetMemeberListPayload

    const scene = await createMemberListScene({
      groupCode: body.group,
      scene: 'groupMemberList_MainWindow',
    })

    const memList = await getNextMemberList({
      sceneId: scene,
      lastId: undefined,
      num: body.size,
    })

    await destroyMemberListScene({
      sceneId: scene,
    })

    detachPromise(
      destroyMemberListScene({
        sceneId: scene,
      }),
    )

    return memList.result?.ids?.map(({ uid, index }) => {
      return {
        uid,
        index,
        detail: memList.result.infos.get(uid),
      }
    })
  },

  '/group/muteMember': async ({ uixCache, req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const { group, memList } = (await getBody()) as GroupMuteMemberPayload

    return await setMemberShutUp({
      groupCode: group,
      memList: (await uixCache.preprocessObject(memList, {
        contextGroup: Number(group),
      })) as MuteMember[],
    })
  },

  '/group/muteEveryone': async ({ req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const { group, enable } = (await getBody()) as GroupMuteEveryonePayload

    return await setGroupShutUp({
      groupCode: group,
      shutUp: enable,
    })
  },

  '/group/kick': async ({ uixCache, req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const { uidList, group, reason, refuseForever } =
      (await getBody()) as GroupKickPayload

    return await kickMember({
      groupCode: group,
      kickUids: uixCache.preprocessArrayOfUix(uidList),
      refuseForever: refuseForever,
      kickReason: reason,
    })
  },

  '/message/recall': async ({ uixCache, req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const { peer, msgIds } = (await getBody()) as MessageRecallPayload

    return recallMsg({
      peer: await uixCache.preprocessObject(peer),
      msgIds: msgIds,
    })
  },

  '/message/fetchRichMedia': async ({
    uixCache,
    req,
    res,
    getBody,
  }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const body = (await getBody()) as Media

    const downloadId = body.msgId + '::' + body.elementId
    console.log('DownloadId:', downloadId)
    const downloadCompletePromise = new Promise<string>((rs) => {
      richMediaDownloadMap[downloadId] = rs
    })

    if (body.chatType === 1 && !body.peerUid.startsWith('u_'))
      body.peerUid = uixCache.map[body.peerUid]!

    await downloadRichMedia({
      getReq: {
        msgId: body.msgId,
        chatType: body.chatType,
        peerUid: body.peerUid,
        elementId: body.elementId,
        thumbSize: 0,
        downloadType: 2,
      },
    })

    const path = await downloadCompletePromise

    res.statusCode = 200
    res.setHeader('Content-Type', getType(path)!)

    const readStream = createReadStream(path)
    readStream.pipe(res)

    return manualHandled
  },

  '/message/getHistory': async ({ uixCache, req, res, getBody }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const { peer, offsetMsgId, count } =
      (await getBody()) as MessageGetHistoryPayload

    return await getMsgsIncludeSelf({
      peer: await uixCache.preprocessObject(peer),
      msgId: offsetMsgId!,
      cnt: count,
      queryOrder: true,
    })
  },

  '/bot/friends': async ({ req, res }: Context) => {
    if (req.method !== 'GET') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    return Object.values(friendMap)
  },

  '/bot/groups': async ({ req, res }: Context) => {
    if (req.method !== 'GET') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    return Object.values(groupMap)
  },

  '/upload': async ({ baseDir, req, res }: Context) => {
    if (req.method !== 'POST') {
      res.writeHead(400)
      res.end('bad request')
      return manualHandled
    }

    const bb = busboy({ headers: req.headers })
    let filePath: PathLike
    let fileInfo: busboy.FileInfo

    bb.on(
      'file',
      (_name, file, info) =>
        void (async () => {
          const saveTo = join(baseDir, `redprotocol-upload`)
          await mkdir(saveTo, { recursive: true })
          filePath = join(
            saveTo,
            `${randomFillSync(Buffer.alloc(16)).toString('hex')}-${
              info.filename
            }`,
          )
          fileInfo = info
          file.pipe(createWriteStream(filePath))
        })(),
    )

    bb.on(
      'close',
      () =>
        void (async () => {
          if (!filePath) {
            res.writeHead(400)
            res.end(`400 bad request`)
            return
          }

          const fileType: {
            mime: string
          } = await getFileType(filePath)

          const category = fileType.mime.split('/')[0]

          const [md5, imageInfo, fileSize] = await Promise.all([
            getFileMd5(filePath),
            category === 'image' ? getImageSizeFromPath(filePath) : undefined,
            getFileSize(filePath),
          ])

          const richMediaPath = await getRichMediaFilePath({
            md5HexStr: md5,
            fileName: fileInfo.filename,
            elementType: 2,
            elementSubType: 0,
            thumbSize: 0,
            needCreate: true,
            fileType: 1,
          })

          await copyFile(filePath, richMediaPath as string)

          res.writeHead(200)

          res.end(
            JSON.stringify({
              md5,
              imageInfo,
              fileSize,
              filePath,
              ntFilePath: richMediaPath,
            }),
          )
        })(),
    )

    req.pipe(bb)

    return manualHandled
  },
} as const

export const chronocat = async () => {
  const baseDir = join(
    process.env['APPDATA'] || homedir(),
    'BetterUniverse/QQNT',
  )

  const token = await initToken(baseDir)

  const uixCache = initUixCache()

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
      routes[url.pathname.replace('/api', '') as keyof typeof routes]
    if (route)
      void route(ctx)
        .then((result) => {
          if (result === manualHandled) return
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
