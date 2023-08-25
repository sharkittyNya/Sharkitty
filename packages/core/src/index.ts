import type { Group, Message, Profile } from '@chronocat/red'
import { randomBytes } from 'node:crypto'
import type { PathLike } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  friendMap,
  groupMap,
  richMediaDownloadMap,
  selfProfile,
} from './ipc/globalVars'
import { initListener } from './ipc/intercept'
import './routes'
import type { ListenerData } from './types'
import { uixCache } from './uixCache'
import { baseDir } from './utils/baseDir'
import { createNormalServers } from './server'
import { filterMessage } from './utils/filterMessage'

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
  const token = await initToken(baseDir)

  const { broadcastAbleServer, binaryServer } = createNormalServers(
    token,
    () => ({
      version: __DEFINE_CHRONO_VERSION__,
      name: 'chronocat',
      authData,
    }),
  )

  const send = (type: string, payload: unknown) =>
    broadcastAbleServer.broadcast(type, payload)

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

  return () => {
    disposeListener()
    binaryServer.stop()
    broadcastAbleServer.stop()
  }
}
