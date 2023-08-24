import type { GroupMuteMemberPayload } from '@chronocat/red'
import type { MuteMember } from '../../ipc/definitions/groupService'
import { setMemberShutUp } from '../../ipc/definitions/groupService'
import type { Context } from '../../types'
import { uixCache } from '../../uixCache'

export const groupMuteMember = async ({ getBody }: Context) => {
  const { group, memList } = (await getBody()) as GroupMuteMemberPayload

  return await setMemberShutUp({
    groupCode: group,
    memList: (await uixCache.preprocessObject(memList, {
      contextGroup: Number(group),
    })) as MuteMember[],
  })
}
