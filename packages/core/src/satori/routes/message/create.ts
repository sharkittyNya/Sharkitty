import { common } from '../../../common'
import { Messager } from '../../messager'
import type { MessageCreatePayload } from '../../types'
import type { RouteContext } from '../types'

export const messageCreate = async ({ config, json }: RouteContext) => {
  const { channel_id, content } = (await json()) as MessageCreatePayload
  return new Messager(config, common, channel_id).send(content)
}
