import { common } from '../../../common'
import { Messager } from '../../messager'
import type { MessageCreatePayload } from '../../types'
import type { RouteContext } from '../types'

export const messageCreate = async ({ config, res, json }: RouteContext) => {
  const { channel_id, content } = (await json()) as MessageCreatePayload

  if (
    !channel_id ||
    !content ||
    (content && Array.isArray(content) && !content.length)
  ) {
    res.writeHead(400)
    res.end('400 bad request')
    return
  }

  return new Messager(config, common, channel_id).send(content)
}
