import { friendMap } from '../../ipc/globalVars'
import type { Context } from '../../types'

export const botFriends = async (_ctx: Context) => Object.values(friendMap)
