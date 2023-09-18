import type { Group, Member, Message, Profile } from '@chronocat/red'
import { ChatType } from '@chronocat/red'
import { getMemberInfo } from './ipc/definitions/groupService'
import {
  friendMap,
  groupMap,
  richMediaDownloadMap,
  roleMap,
  selfProfile,
  sendCallbackMap,
  sendQueue,
} from './ipc/globalVars'
import { initListener } from './ipc/intercept'
import { getModules } from './modules'
import { setMsgCache } from './msgCache'
import './routes'
import { sendForwardMsgBuffer } from './routes/message/sendForward'
import { createNormalServers } from './server'
import type { ListenerData } from './types'
import { uixCache } from './uixCache'
import { filterMessage } from './utils/filterMessage'
import { initToken } from './utils/token'

declare const __DEFINE_CHRONO_VERSION__: string
declare const authData: {
  uid: string
}

const initHooks = async () => {
  try {
    const modules = await getModules()
    modules.native.performHooks()
    modules.native.setPBPreprocessorForGzHook(() => sendForwardMsgBuffer)
  } catch (e) {
    console.log('Failed to inject hooks', e)
  }
}

export const chronocat = async () => {
  void initHooks()

  const token = await initToken()

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

        const prepareRole = async (msg: Message) => {
          if (msg.chatType === ChatType.Group) {
            await getMemberInfo({
              forceUpdate: false,
              groupCode: +msg.peerUid,
              uids: [msg.senderUid],
            })
          }
        }

        const fillRole = (msg: Message) => {
          if (msg.chatType === ChatType.Group) {
            msg.roleType = roleMap[msg.peerUid]?.[msg.senderUid]
          }
        }

        const filteredPayload = await Promise.all(
          payload.msgList.filter(filterMessage).map(async (msg) => {
            await prepareRole(msg)
            msg = await uixCache.preprocessObject(msg)
            setMsgCache(msg)
            fillRole(msg)
            return msg
          }),
        )

        if (filteredPayload.length) send('message::recv', filteredPayload)
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

      case 'nodeIKernelGroupListener/onMemberInfoChange': {
        const { groupCode, members } = Payload as {
          groupCode: string
          dataSource: number
          members: [
            string,
            {
              uin: string
              role: number
            },
          ][] & {
            get: (uid: string) => Member
          }
        }

        for (const [uid, { uin, role }] of members) {
          uixCache.addToMap(uid, uin)
          if (!(groupCode in roleMap)) roleMap[groupCode] = {}
          roleMap[groupCode][uid] = role
        }
        break
      }

      case 'nodeIKernelGroupListener/onMemberListChange': {
        const payload = Payload as {
          info: {
            sceneId: string
            ids: unknown[]
            infos: [
              string,
              {
                uin: string
                role: number
              },
            ][] & {
              get: (uid: string) => Member
            }
          }
        }

        const groupCode = payload.info.sceneId.split('_')[0]
        if (!groupCode) break

        for (const [uid, { uin, role }] of payload.info.infos) {
          uixCache.addToMap(uid, uin)
          if (!(groupCode in roleMap)) roleMap[groupCode] = {}
          roleMap[groupCode][uid] = role
        }

        break
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

      case 'nodeIKernelMsgListener/onAddSendMsg': {
        const { msgRecord } = Payload as {
          msgRecord: Message
        }
        sendCallbackMap[msgRecord.msgId] = sendQueue.shift()
        return
      }

      case 'nodeIKernelMsgListener/onMsgInfoListUpdate': {
        const { msgList } = Payload as {
          msgList: Message[]
        }
        for (const msg of msgList) {
          if (msg.sendStatus > 1) {
            sendCallbackMap[msg.msgId]?.(await uixCache.preprocessObject(msg))
            delete sendCallbackMap[msg.msgId]
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
