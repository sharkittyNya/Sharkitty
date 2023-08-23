import type { PathLike } from 'node:fs'
import { defineApi } from '../define'

export const getFileMd5 = defineApi<string, [PathLike]>(
  'IPC_UP_2',
  'ns-fsApi-2',
  'getFileMd5',
)

export const getImageSizeFromPath = defineApi<unknown, [PathLike]>(
  'IPC_UP_2',
  'ns-fsApi-2',
  'getImageSizeFromPath',
)

export const getFileSize = defineApi<number, [PathLike]>(
  'IPC_UP_2',
  'ns-fsApi-2',
  'getFileSize',
)

export const getFileType = defineApi<
  {
    mime: string
  },
  [PathLike]
>('IPC_UP_2', 'ns-fsApi-2', 'getFileType')
