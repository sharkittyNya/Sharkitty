import {
  createMemberListScene,
  destroyMemberListScene,
  searchMember,
} from './ipc/definitions/groupService'
import { detachPromise } from './utils/detach-promise'
import { memoize } from './utils/memoize'

export const initUixCache = () => {
  const map: Record<string, string> = {}

  const enumerateAll = (
    obj: object,
  ): [string, unknown, Record<string, unknown>][] => {
    const entries: [string, unknown, Record<string, unknown>][] = []
    const enumerate = (obj: Record<string, unknown>) => {
      for (const key in obj) {
        if (obj[key] instanceof Map) continue
        if (obj[key] instanceof Object)
          enumerate(obj[key] as Record<string, unknown>)
        else entries.push([key, obj[key], obj])
      }
    }
    enumerate(obj as Record<string, unknown>)
    return entries
  }

  const genCorrespondingName = (name: string): string | undefined => {
    const keyMap: Record<string, string> = {
      uid: 'uin',
      uin: 'uid',
      Uid: 'Uin',
      Uin: 'Uid',
    }

    for (const key in keyMap) {
      if (name.endsWith(key)) {
        const k = name.slice(0, -key.length)
        return k + keyMap[key]
      }
    }
    return undefined
  }

  const addToMap = (a: string, b: string) => {
    if (parseInt(a) === 0 || parseInt(b) === 0) return
    map[a] = b
    map[b] = a
  }

  const performSearch = memoize(async (contextGroup) => {
    const scene = await createMemberListScene({
      groupCode: contextGroup as number,
      scene: 'groupMemberList_MainWindow',
    })

    detachPromise(
      searchMember({
        sceneId: scene,
        keyword: contextGroup as string,
      }),
    )

    await destroyMemberListScene({
      sceneId: scene,
    })
  })

  const cacheObject = (object: Record<string, unknown>) => {
    for (const [key, value, obj] of enumerateAll(object)) {
      const cKey = genCorrespondingName(key)
      if (cKey && obj[cKey]) {
        if (
          parseInt(obj[cKey] as string) == 0 ||
          !obj[cKey] ||
          (obj[cKey] as string).includes('*') ||
          map[value as string]
        )
          continue

        addToMap(value as string, obj[cKey] as string)
      }
    }
  }

  const preprocessObject = async <T extends object>(
    origin: T,
    { contextGroup = -1 } = {},
  ): Promise<T> => {
    const eAll = enumerateAll(origin)

    for (const [key, value, obj] of eAll) {
      const cKey = genCorrespondingName(key)
      if (cKey && !obj[cKey]) {
        if (key.toLocaleLowerCase().endsWith('uin')) {
          if (contextGroup !== -1) performSearch(contextGroup, value)
        }

        if (key === 'atNtUid') {
          performSearch(
            contextGroup,
            (
              obj as {
                content: string
              }
            ).content.slice(1),
          )
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 80))

    for (const [key, value, obj] of eAll) {
      const cKey = genCorrespondingName(key)
      if (key === 'peerUin' && obj['chatType'] === 2) obj['peerUid'] = value
      if (key === 'peerUid' && !(value as string).startsWith('u_'))
        obj['peerUin'] = value
      if (cKey && !obj[cKey] && map[value as string])
        obj[cKey] = map[value as string]
    }
    return origin
  }

  const preprocessArrayOfUix = (arr: string[]) => arr.map((v) => map[v] ?? v)

  return {
    cacheObject,
    preprocessObject,
    addToMap,
    preprocessArrayOfUix,
    map,
  }
}

export type UixCache = ReturnType<typeof initUixCache>
