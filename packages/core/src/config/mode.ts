// eslint-disable-next-line import/no-unresolved
import { app } from 'electron'

let modes: string[] | undefined = undefined

const splitModes = (modes: string) => modes.split(',').filter(Boolean)

const loadModes = async () => {
  const result = splitModes(
    app.commandLine.getSwitchValue('chrono-mode'),
  ).concat(splitModes(process.env['CHRONO_MODE'] || ''))

  if (result.includes('headless')) result.push('login')

  return [...new Set(result)]
}

export const getChronocatModes = async () => {
  if (!modes) modes = await loadModes()
  return modes
}

export const isChronocatMode = (mode: string) =>
  getChronocatModes().then((modes) => modes.includes(mode))
