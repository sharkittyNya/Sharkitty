import { defineApi } from '../define'

export type SceneId = unknown

export const createMemberListScene = defineApi<
  SceneId,
  [
    {
      groupCode: number
      scene: 'groupMemberList_MainWindow'
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/createMemberListScene')

export const searchMember = defineApi<
  undefined,
  [
    {
      sceneId: SceneId
      keyword: string
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/searchMember')

export const destroyMemberListScene = defineApi<
  undefined,
  [
    {
      sceneId: SceneId
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/destroyMemberListScene')

export interface MemberListResult {
  result: {
    ids: {
      uid: string
      index: string
    }[]
    infos: {
      get: (uid: string) => unknown
    }
  }
}

export const getNextMemberList = defineApi<
  MemberListResult,
  [
    {
      sceneId: SceneId
      lastId: undefined
      num: number
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/getNextMemberList')

export interface MuteMember {
  uin: string
  timeStamp: number
}

export const setMemberShutUp = defineApi<
  unknown,
  [
    {
      groupCode: string
      memList: MuteMember[]
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/setMemberShutUp')

export const setGroupShutUp = defineApi<
  unknown,
  [
    {
      groupCode: string
      shutUp: boolean
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/setGroupShutUp')

export const kickMember = defineApi<
  unknown,
  [
    {
      groupCode: string
      kickUids: string[]
      refuseForever: boolean
      kickReason: string
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelGroupService/kickMember')
