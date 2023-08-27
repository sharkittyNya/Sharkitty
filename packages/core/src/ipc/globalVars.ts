import type { Group, Profile } from '@chronocat/red'
import type { Detail, Uuid } from '../types'

export const requestCallbackMap: Record<Uuid, unknown> = {}
export const responseMap: Record<
  Uuid,
  {
    resolved?: Detail
  }
> = {}
export const requestMap: Record<Uuid, unknown> = {}

export const groupMap: Record<string, Group> = {}
export const roleMap: Record<string, Record<string, number>> = {}
export const friendMap: Record<string, unknown> = {}
export const richMediaDownloadMap: Record<string, (path: string) => void> = {}
export const selfProfile: {
  value?: Profile
} = {}
