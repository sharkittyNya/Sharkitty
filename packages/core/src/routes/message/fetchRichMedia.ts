import type { Media } from '@chronocat/red'
import { getType } from 'mime/lite'
import { createReadStream } from 'node:fs'
import { downloadRichMedia } from '../../ipc/definitions/msgService'
import { richMediaDownloadMap } from '../../ipc/globalVars'
import { router } from '../../router'
import { uixCache } from '../../uixCache'

router.message.fetchRichMedia.$body('json')(async ({ body }) => {
  let { msgId, elementId, chatType, peerUid } = body as Media

  const downloadId = msgId + '::' + elementId
  console.log('DownloadId:', downloadId)
  const downloadCompletePromise = new Promise<string>((rs) => {
    richMediaDownloadMap[downloadId] = rs
  })

  if (chatType === 1 && !peerUid.startsWith('u_'))
    peerUid = uixCache.map[peerUid]!

  await downloadRichMedia({
    getReq: {
      msgId,
      chatType,
      peerUid,
      elementId,
      thumbSize: 0,
      downloadType: 2,
    },
  })

  const path = await downloadCompletePromise

  // TODO
  res!.statusCode = 200
  res!.setHeader('Content-Type', getType(path)!)

  const readStream = createReadStream(path)
  readStream.pipe(res!)
})
