import type { GroupMuteEveryonePayload } from '@chronocat/red'
import { setGroupShutUp } from '../../ipc/definitions/groupService'
import type { Context } from '../../types'

export const groupMuteEveryone = async ({ getBody }: Context) => {
  const { group, enable } = (await getBody()) as GroupMuteEveryonePayload

  return await setGroupShutUp({
    groupCode: group,
    shutUp: enable,
  })
}
