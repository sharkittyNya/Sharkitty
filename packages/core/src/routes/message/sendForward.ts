import type { MessageSendForwardPayload } from '@chronocat/red'
import type { msg } from 'miraigo'
import miraigo from 'miraigo'
import type { Root } from 'protobufjs/light'
import { multiForwardMsgWithComment } from '../../ipc/definitions/msgService'
import { getMsgCache } from '../../msgCache'
import { router } from '../../router'
import { uixCache } from '../../uixCache'
import { sleep } from '../../utils/time'

const PbMultiMsgTransmit = (miraigo as unknown as Root).lookupType(
  'msg.PbMultiMsgTransmit',
) as unknown as typeof msg.PbMultiMsgTransmit

export let sendForwardMsgBuffer = Buffer.alloc(0)
export let sendForwardCoverBuffer = Buffer.alloc(0)

let task = Promise.resolve<unknown>(undefined)

router.message.unsafeSendForward.$body('json')(async ({ body }) => {
  const payload = body as MessageSendForwardPayload

  const srcContact = await uixCache.preprocessObject(payload.srcContact)
  const dstContact = await uixCache.preprocessObject(payload.dstContact)
  let msgInfos = undefined as unknown as {
    msgId: string
    senderShowName: string
  }[]
  let msgBuffer = Buffer.alloc(0)
  let coverBuffer = Buffer.alloc(0)

  if (!payload.msgInfos && !payload.msgElements)
    throw new Error('message body not found')
  else if (payload.msgInfos && payload.msgElements)
    throw new Error('msgInfos OR msgElements are accepted, not both')
  else if (payload.msgInfos) {
    // 普通合并转发
    msgInfos = payload.msgInfos
  } else {
    // 伪造合并转发
    const lastMsg = getMsgCache(srcContact)
    if (!lastMsg) throw new Error('send a message first')

    msgInfos = [
      {
        msgId: lastMsg.msgId,
        senderShowName: 'CHRONO_FAKEFORWARD',
      },
    ]

    processElements(payload.msgElements!)

    msgBuffer = Buffer.from(
      PbMultiMsgTransmit.encode(
        PbMultiMsgTransmit.create({
          pbItemList: [
            {
              fileName: 'MultiMsg',
              buffer: {
                msg: payload.msgElements!,
              },
            },
          ],
        }),
      ).finish(),
    )

    if (payload.coverElements) {
      msgInfos[0]!.senderShowName += '_WITHCOVER'

      processElements(payload.coverElements)

      coverBuffer = Buffer.from(
        PbMultiMsgTransmit.encode(
          PbMultiMsgTransmit.create({
            pbItemList: [
              {
                fileName: 'MultiMsg',
                buffer: {
                  msg: payload.coverElements,
                },
              },
            ],
          }),
        ).finish(),
      )
    }
  }

  task = task
    .then(() => sleep(80))
    .then(async () => {
      try {
        sendForwardMsgBuffer = msgBuffer
        sendForwardCoverBuffer = coverBuffer

        return await multiForwardMsgWithComment({
          msgInfos,
          srcContact,
          dstContact,
          commentElements: [],
        })
      } catch (e) {
        console.log(e)

        throw e
      }
    })

  return await task
})

function processElements(elements: msg.IMessage[]) {
  for (const element of elements)
    if (Number(element.head!.field2))
      element.head!.field2 = (uixCache.map[element.head!.field2!] ||
        element.head!.field2) as string
}
