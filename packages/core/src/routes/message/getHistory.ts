import type { MessageGetHistoryPayload } from '@chronocat/red'
import { getMsgsIncludeSelf } from '../../ipc/definitions/msgService'
import { router } from '../../router'
import { uixCache } from '../../uixCache'

router.message.getHistory.$body('json')(async ({ body }) => {
  const { peer, offsetMsgId, count } = body as MessageGetHistoryPayload

  return await getMsgsIncludeSelf({
    peer: await uixCache.preprocessObject(peer),
    msgId: offsetMsgId!,
    cnt: count,
    queryOrder: true,
  })
})
