import { groupMap } from '../../ipc/globalVars'
import type { Context } from '../../types'

export const botGroups = async (_ctx: Context) => Object.values(groupMap)
