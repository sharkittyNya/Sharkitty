import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { baseDir } from './baseDir'

export const initToken = async () => {
  const path = join(baseDir, 'RED_PROTOCOL_TOKEN')
  try {
    return (await readFile(path, 'utf-8')).trim()
  } catch (e) {
    // Ignore
  }
  const generatedToken = randomBytes(32).toString('hex')
  await mkdir(baseDir, { recursive: true })
  await writeFile(path, generatedToken)
  return generatedToken
}
