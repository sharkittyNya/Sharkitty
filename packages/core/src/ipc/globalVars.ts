import type { Uuid, Detail } from '../types'

export const requestCallbackMap: Record<Uuid, unknown> = {}
export const responseMap: Record<
  Uuid,
  {
    resolved?: Detail
  }
> = {}
export const requestMap: Record<Uuid, unknown> = {}
