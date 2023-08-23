import type { Peer, RecursivePartial, Element } from '@chronocat/red'
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

export const downloadRichMedia = defineApi<
  unknown,
  [
    {
      getReq: {
        msgId: string
        chatType: number
        peerUid: string
        elementId: string
        thumbSize: number
        downloadType: number
      }
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/downloadRichMedia')

export const getMsgsIncludeSelf = defineApi<
  unknown,
  [
    {
      peer: Peer
      msgId: string
      cnt: number
      queryOrder: boolean
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/getMsgsIncludeSelf')

export const getRichMediaFilePath = defineApi<
  unknown,
  [
    {
      md5HexStr: string
      fileName: string
      elementType: number
      elementSubType: number
      thumbSize: number
      needCreate: boolean
      fileType: number
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/getRichMediaFilePath')

export const sendMsg = defineApi<
  unknown,
  [
    {
      msgId: '0'
      peer: Peer
      msgElements: RecursivePartial<Element>[]
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/sendMsg')
