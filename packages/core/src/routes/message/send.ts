import type { MessageSendPayload } from '@chronocat/red'
import { sendMsg } from '../../ipc/definitions/msgService'
import { router } from '../../router'
import { uixCache } from '../../uixCache'
import { filterMessage } from '../../utils/filterMessage'
import { makeFullPacket } from '../../utils/packetHelper'

router.message.send.$body('json')(async ({ body }) => {
  const payload = body as MessageSendPayload

  if (!filterMessage(payload)) return {}

  makeFullPacket(payload as unknown as Record<string, unknown>)

  return sendMsg({
    msgId: '0',
    peer: await uixCache.preprocessObject(payload.peer),
    msgElements: await uixCache.preprocessObject(payload.elements, {
      contextGroup:
        payload.peer.chatType === 2 ? Number(payload.peer.peerUin) : undefined,
    }),
  })
})
