import path from 'node:path'
import type { UploadResponse } from './types'

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

    peerPrivate: (peerUin: string) =>
      r('peer/private', {
        peerUin,
      }),

    peerGroup: (peerUin: string) =>
      r('peer/group', {
        peerUin,
      }),

    text: (content: string) => ({
      elementId: '',
      elementType: 1,
      textElement: {
        content,
        atUid: '',
        atNtUid: '',
        atTinyUid: '',
        atType: 0,
      },
    }),

    at: (name: string, id: string) => ({
      elementId: '',
      elementType: 1,
      textElement: {
        content: `@${name}`,
        atUid: id === 'all' ? 'all' : '',
        atNtUin: (id === 'all' ? undefined : id) as string,
        atNtUid: (id === 'all' ? 'all' : undefined) as string,
        atTinyUid: '',
        atType: id === 'all' ? 1 : 2,
      },
    }),

    remoteImage: (uploadResponse: UploadResponse, picType: number) => ({
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
      waveAmplitudes?: number[],
    ) => ({
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
        duration: 1,
        formatType: 1,
        voiceType: 1,
        voiceChangeType: 0,
        playState: 1,
        waveAmplitudes: waveAmplitudes || [
          99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        ],
      },
    }),
  }

  return Object.defineProperties(
    r,
    Object.fromEntries(Object.entries(h).map(([k, value]) => [k, { value }])),
  ) as typeof r & typeof h
}

export const r = b()
