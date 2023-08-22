import { rm } from 'fs/promises'
import { resolve } from 'node:path'

void Promise.all([
  rm(resolve(__dirname, '../build'), {
    force: true,
    recursive: true,
  }),
  rm(resolve(__dirname, '../packages/core/tsconfig.buildinfo'), {
    force: true,
    recursive: true,
  }),
])
