import { homedir } from 'node:os'
import { join } from 'node:path'

export const baseDir = join(
  process.env['APPDATA'] || homedir(),
  'BetterUniverse/QQNT',
)
