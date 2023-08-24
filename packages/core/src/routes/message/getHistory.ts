import type { MessageGetHistoryPayload } from '@chronocat/red'
import { getMsgsIncludeSelf } from '../../ipc/definitions/msgService'
import type { Context } from '../../types'
import { uixCache } from '../../uixCache'

export const messageGetHistory = async ({ getBody }: Context) => {
  const { peer, offsetMsgId, count } =
    (await getBody()) as MessageGetHistoryPayload

  return await getMsgsIncludeSelf({
    peer: await uixCache.preprocessObject(peer),
    msgId: offsetMsgId!,
    cnt: count,
    queryOrder: true,
  })
}
