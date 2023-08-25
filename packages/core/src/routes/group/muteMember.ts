import type { GroupMuteMemberPayload } from '@chronocat/red'
import type { MuteMember } from '../../ipc/definitions/groupService'
import { setMemberShutUp } from '../../ipc/definitions/groupService'
import { router } from '../../router'
import { uixCache } from '../../uixCache'

router.group.muteMember.$body('json')(async ({ body }) => {
  const { group: groupCode, memList } = body as GroupMuteMemberPayload

  return await setMemberShutUp({
    groupCode,
    memList: (await uixCache.preprocessObject(memList, {
      contextGroup: Number(groupCode),
    })) as MuteMember[],
  })
})
