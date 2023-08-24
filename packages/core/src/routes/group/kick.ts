import type { GroupKickPayload } from '@chronocat/red'
import { kickMember } from '../../ipc/definitions/groupService'
import type { Context } from '../../types'
import { uixCache } from '../../uixCache'

export const groupKick = async ({ getBody }: Context) => {
  const { uidList, group, reason, refuseForever } =
    (await getBody()) as GroupKickPayload

  return await kickMember({
    groupCode: group,
    kickUids: uixCache.preprocessArrayOfUix(uidList),
    refuseForever: refuseForever,
    kickReason: reason,
  })
}
