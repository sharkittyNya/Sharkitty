const wsClientListener = (raw: Buffer) =>
void (async () => {
  const { type, payload } = JSON.parse(
    raw.toString(),
  ) as WsPackage<MessageSendPayload>

  switch (type) {
    case 'message::send': {
      if (!filterMessage(payload)) return

      makeFullPacket(payload as unknown as Record<string, unknown>)

      await sendMsg({
        msgId: '0',
        peer: await uixCache.preprocessObject(payload.peer),
        msgElements: await uixCache.preprocessObject(payload.elements, {
          contextGroup:
            payload.peer.chatType === 2
              ? Number(payload.peer.peerUin)
              : undefined,
        }),
      })

      return
    }
  }
})()
