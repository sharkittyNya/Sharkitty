import { load } from 'js-yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ChronocatCurrentConfig } from '../../config.types'
import { getAuthData } from '../authData'
import { baseDir } from '../baseDir'
import { ensureConfig } from './ensure'
import { parseConfig } from './parser'

let config: ChronocatCurrentConfig | undefined = undefined

const loadConfig = async () => {
  const configDir = join(baseDir, 'config')
  const configPath = join(configDir, 'chronocat.yml')

  await ensureConfig()

  const config = load(await readFile(configPath, 'utf-8'))
  const { uin } = await getAuthData()

  return parseConfig(config, uin)
}

export const getConfig = async () => {
  if (!config) config = await loadConfig()
  return config
}
