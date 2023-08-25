import type { MessageRecallPayload } from '@chronocat/red'
import { recallMsg } from '../../ipc/definitions/msgService'
import { router } from '../../router'
import { uixCache } from '../../uixCache'

router.message.recall.$body('json')(async ({ body }) => {
  const { peer, msgIds } = body as MessageRecallPayload

  return recallMsg({
    peer: await uixCache.preprocessObject(peer),
    msgIds: msgIds,
  })
})
