import type { Object } from 'ts-toolbelt'
import type { Element, Peer } from '../../red'
import { defineIpcApi } from '../define'

export const recallMsg = defineIpcApi<
  unknown,
  [
    {
      peer: Peer
      msgIds: string[]
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/recallMsg')

export const downloadRichMedia = defineIpcApi<
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

export const getMsgsIncludeSelf = defineIpcApi<
  object,
  [
    {
      peer: Peer
      msgId: string
      cnt: number
      queryOrder: boolean
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/getMsgsIncludeSelf')

export const getRichMediaFilePath = defineIpcApi<
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

export const sendMsg = defineIpcApi<
  unknown,
  [
    {
      msgId: '0'
      peer: Peer
      msgElements: Object.Partial<Element, 'deep'>[]
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/sendMsg')

export const multiForwardMsgWithComment = defineIpcApi<
  unknown,
  [
    {
      msgInfos: {
        msgId: string
        senderShowName: string
      }[]
      srcContact: Peer
      dstContact: Peer
      commentElements: []
    },
  ]
>('IPC_UP_2', 'ns-ntApi-2', 'nodeIKernelMsgService/multiForwardMsgWithComment')
