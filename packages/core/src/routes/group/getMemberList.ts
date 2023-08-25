import type { GroupGetMemeberListPayload } from '@chronocat/red'
import {
  createMemberListScene,
  destroyMemberListScene,
  getNextMemberList,
} from '../../ipc/definitions/groupService'
import { router } from '../../router'
import { detachPromise } from '../../utils/detachPromise'

router.group.getMemberList.$body('json')(async ({ body }) => {
  const { group: groupCode, size: num } = body as GroupGetMemeberListPayload

  const scene = await createMemberListScene({
    groupCode,
    scene: 'groupMemberList_MainWindow',
  })

  const memList = await getNextMemberList({
    sceneId: scene,
    lastId: undefined,
    num,
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
})
