import type { MessageRecallPayload } from '@chronocat/red'
import { recallMsg } from '../../ipc/definitions/msgService'
import type { Context } from '../../types'
import { uixCache } from '../../uixCache'

export const messageRecall = async ({ getBody }: Context) => {
  const { peer, msgIds } = (await getBody()) as MessageRecallPayload

  return recallMsg({
    peer: await uixCache.preprocessObject(peer),
    msgIds: msgIds,
  })
}
