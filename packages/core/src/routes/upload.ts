import busboy from 'busboy'
import { randomFillSync } from 'node:crypto'
import type { PathLike } from 'node:fs'
import { createWriteStream } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  getFileMd5,
  getFileSize,
  getFileType,
  getImageSizeFromPath,
} from '../ipc/definitions/fsApi'
import { getRichMediaFilePath } from '../ipc/definitions/msgService'
import { router } from '../router'
import { baseDir } from '../utils/baseDir'

router.upload.$body('binary').$httpOnly('POST')(
  async ({ http: { req, res } }) => {
    const bb = busboy({ headers: req.headers })
    let filePath: PathLike
    let fileInfo: busboy.FileInfo

    bb.on(
      'file',
      (_name, file, info) =>
        void (async () => {
          const saveTo = join(baseDir, `redprotocol-upload`)
          await mkdir(saveTo, { recursive: true })
          filePath = join(
            saveTo,
            `${randomFillSync(Buffer.alloc(16)).toString('hex')}-${
              info.filename
            }`,
          )
          fileInfo = info
          file.pipe(createWriteStream(filePath))
        })(),
    )

    bb.on(
      'close',
      () =>
        void (async () => {
          if (!filePath) {
            res.writeHead(400)
            res.end(`400 bad request`)
            return
          }

          const fileType: {
            mime: string
          } = await getFileType(filePath)

          const category = fileType.mime.split('/')[0]

          const [md5, imageInfo, fileSize] = await Promise.all([
            getFileMd5(filePath),
            category === 'image' ? getImageSizeFromPath(filePath) : undefined,
            getFileSize(filePath),
          ])

          const richMediaPath = await getRichMediaFilePath({
            md5HexStr: md5,
            fileName: fileInfo.filename,
            elementType: 2,
            elementSubType: 0,
            thumbSize: 0,
            needCreate: true,
            fileType: 1,
          })

          await copyFile(filePath, richMediaPath as string)

          res.writeHead(200)

          res.end(
            JSON.stringify({
              md5,
              imageInfo,
              fileSize,
              filePath,
              ntFilePath: richMediaPath,
            }),
          )
        })(),
    )

    req.pipe(bb)
  },
)
