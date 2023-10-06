import { commonSend } from './send'

export const common = {
  send: commonSend,
} as const

export type Common = typeof common
