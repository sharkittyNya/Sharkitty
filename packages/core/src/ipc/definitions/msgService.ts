import type { Peer } from '@chronocat/red'
import { defineApi } from '../define'

export const recallMsg = defineApi<
  unknown,
  [
    {
      peer: Peer
      msgIds: string[]
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/recallMsg')
