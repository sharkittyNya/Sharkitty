import { selfProfile } from '../ipc/globalVars'
import type { Context } from '../types'

export const getSelfProfile = async (_ctx: Context) => selfProfile.value ?? {}
