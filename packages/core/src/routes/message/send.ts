import { sendMsg } from '../../ipc/definitions/msgService'
import { sendQueue } from '../../ipc/globalVars'
import type { MessageSendPayload } from '../../red'
import { router } from '../../router'
import { uixCache } from '../../uixCache'
import { detachPromise } from '../../utils/detachPromise'
import { filterMessage } from '../../utils/filterMessage'
import { makeFullPacket } from '../../utils/packetHelper'
import { timeout } from '../../utils/time'

router.message.send.$body('json')(async ({ body }) => {
  const payload = body as MessageSendPayload

  if (!filterMessage(payload)) return {}

  makeFullPacket(payload as unknown as Record<string, unknown>)

  const param = {
    msgId: '0',
    msgAttributeInfos: new Map(),
    peer: await uixCache.preprocessObject(payload.peer),
    msgElements: await uixCache.preprocessObject(payload.elements, {
      contextGroup:
        payload.peer.chatType === 2 ? Number(payload.peer.peerUin) : undefined,
    }),
  } as const

  return await new Promise((resolve, reject) => {
    sendQueue.push(resolve)
    detachPromise(sendMsg(param))
    setTimeout(() => {
      const index = sendQueue.indexOf(resolve)
      if (index >= 0) {
        sendQueue.splice(index, 1)
        reject()
      }
    }, timeout)
  })
})
