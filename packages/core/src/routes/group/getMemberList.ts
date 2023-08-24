import type { GroupGetMemeberListPayload } from '@chronocat/red'
import type { Context } from '../../types'
import {
  createMemberListScene,
  getNextMemberList,
  destroyMemberListScene,
} from '../../ipc/definitions/groupService'
import { detachPromise } from '../../utils/detach-promise'

export const groupGetMemberList = async ({ getBody }: Context) => {
  const body = (await getBody()) as GroupGetMemeberListPayload

  const scene = await createMemberListScene({
    groupCode: body.group,
    scene: 'groupMemberList_MainWindow',
  })

  const memList = await getNextMemberList({
    sceneId: scene,
    lastId: undefined,
    num: body.size,
  })

  await destroyMemberListScene({
    sceneId: scene,
  })

  detachPromise(
    destroyMemberListScene({
      sceneId: scene,
    }),
  )

  return memList.result?.ids?.map(({ uid, index }) => {
    return {
      uid,
      index,
      detail: memList.result.infos.get(uid),
    }
  })
}
