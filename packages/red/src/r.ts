import path from 'node:path'
import type { Object as ToolBeltObject } from 'ts-toolbelt'
import type { Element, Peer, UploadResponse } from './types'

const b = () => {
  const reg = {
    'payload/sendMsg': {
      msgId: '0',
      elements: [],
    },

    'peer/private': {
      chatType: 1,
      guildId: '',
      peerUid: '',
      peerUin: '',
    },
    'peer/group': {
      chatType: 2,
      guildId: '',
      peerUid: '',
      peerUin: '',
    },
  } as const

  const r = <T extends keyof typeof reg, D>(type: T, data: D) =>
    Object.assign({}, reg[type], data) as (typeof reg)[T] & D

  const h = {
    reg,

    peerPrivate: (peerUin: string): Peer =>
      r('peer/private', {
        peerUin,
      }),

    peerGroup: (peerUin: string): Peer =>
      r('peer/group', {
        peerUin,
      }),

    text: (content: string): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 1,
      textElement: {
        content,
        atUid: '',
        atNtUid: '',
        atTinyId: '',
        atType: 0,
      },
    }),

    at: (
      name: string,
      id: string,
    ): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 1,
      textElement: {
        content: `@${name}`,
        atUid: id === 'all' ? 'all' : '',
        atNtUin: (id === 'all' ? undefined : id) as string,
        atNtUid: (id === 'all' ? 'all' : undefined) as string,
        atTinyId: '',
        atType: id === 'all' ? 1 : 2,
      },
    }),

    reply: (
      /**
       * 消息序号，必填。
       *
       * 可由消息 ID 通过 message/getHistory 换取。
       */
      replayMsgSeq: string,

      /**
       * 消息 ID，选填。
       *
       * 不填则在手机非 NT 版本
       * QQ（8.9.63 以下版本）无法看到引用消息。
       */
      replayMsgId?: string,

      /**
       * 引用消息的发送者 QQ，选填。
       *
       * 不填则消息前会有一个奇怪的「@」文本。
       */
      senderUin?: string,
    ): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 7,
      replyElement: {
        replayMsgId,
        replayMsgSeq,
        senderUin,
        senderUinStr: senderUin,
      },
    }),

    remoteImage: (
      uploadResponse: UploadResponse,
      picType: number,
    ): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 2,
      extBufForUI: '',
      picElement: {
        fileName: path.basename(uploadResponse.ntFilePath),
        fileSize: String(uploadResponse.fileSize),
        fileSubId: '',
        fileUuid: '',
        md5HexStr: uploadResponse.md5,
        original: true,
        picHeight: uploadResponse.imageInfo!.height,
        picWidth: uploadResponse.imageInfo!.width,
        picType,
        picSubType: 0,
        sourcePath: uploadResponse.ntFilePath,
        summary: '',
        thumbFileSize: 0,
        // thumbPath: undefined,
      },
    }),

    remoteAudio: (
      uploadResponse: UploadResponse,
      duration: number,
      waveAmplitudes?: number[],
    ): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 4,
      pttElement: {
        canConvert2Text: true,
        fileName: path.basename(uploadResponse.ntFilePath),
        filePath: uploadResponse.ntFilePath,
        md5HexStr: uploadResponse.md5,
        fileId: 0,
        fileSubId: '',
        fileSize: String(uploadResponse.fileSize),
        duration,
        formatType: 1,
        voiceType: 1,
        voiceChangeType: 0,
        playState: 1,
        waveAmplitudes: waveAmplitudes || [
          99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        ],
      },
    }),

    remoteFile: (
      uploadResponse: UploadResponse,
    ): ToolBeltObject.Partial<Element, 'deep'> => ({
      elementId: '',
      elementType: 3,
      fileElement: {
        fileMd5: '',
        fileName: path.basename(uploadResponse.filePath),
        filePath: uploadResponse.filePath,
        fileSize: String(uploadResponse.fileSize),
        picHeight: 0,
        picWidth: 0,
        picThumbPath: {},
        file10MMd5: '',
        fileSha: '',
        fileSha3: '',
        fileUuid: '',
        fileSubId: '',
        thumbFileSize: 750,
      },
    }),
  }

  return Object.defineProperties(
    r,
    Object.fromEntries(Object.entries(h).map(([k, value]) => [k, { value }])),
  ) as typeof r & typeof h
}

export const r = b()
