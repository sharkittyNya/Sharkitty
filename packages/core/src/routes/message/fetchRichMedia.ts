import { getType } from 'mime/lite'
import { createReadStream } from 'node:fs'
import { downloadRichMedia } from '../../ipc/definitions/msgService'
import { richMediaDownloadMap } from '../../ipc/globalVars'
import type { Media } from '../../red'
import { router } from '../../router'
import { uixCache } from '../../uixCache'

router.message.fetchRichMedia.$body('json').$httpOnly(true)(
  async ({ body, http }) => {
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
        downloadType: 1,
      },
    })

    const path = await downloadCompletePromise

    http.res.statusCode = 200
    http.res.setHeader('Content-Type', getType(path)!)

    const readStream = createReadStream(path)
    await new Promise((resolve, reject) =>
      readStream.pipe(http.res).on('finish', resolve).on('error', reject),
    )
    http.res.end()
  },
)
