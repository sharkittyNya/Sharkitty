import type { Media } from '@chronocat/red'
import { getType } from 'mime/lite'
import { createReadStream } from 'node:fs'
import { downloadRichMedia } from '../../ipc/definitions/msgService'
import { richMediaDownloadMap } from '../../ipc/globalVars'
import type { Context } from '../../types'
import { uixCache } from '../../uixCache'

export const messageFetchRichMedia = async ({ res, getBody }: Context) => {
  const body = (await getBody()) as Media

  const downloadId = body.msgId + '::' + body.elementId
  console.log('DownloadId:', downloadId)
  const downloadCompletePromise = new Promise<string>((rs) => {
    richMediaDownloadMap[downloadId] = rs
  })

  if (body.chatType === 1 && !body.peerUid.startsWith('u_'))
    body.peerUid = uixCache.map[body.peerUid]!

  await downloadRichMedia({
    getReq: {
      msgId: body.msgId,
      chatType: body.chatType,
      peerUid: body.peerUid,
      elementId: body.elementId,
      thumbSize: 0,
      downloadType: 2,
    },
  })

  const path = await downloadCompletePromise

  res!.statusCode = 200
  res!.setHeader('Content-Type', getType(path)!)

  const readStream = createReadStream(path)
  readStream.pipe(res!)
}
