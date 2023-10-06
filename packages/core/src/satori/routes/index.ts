import { loginGet } from './login/get'
import { messageCreate } from './message/create'
import type { Route } from './types'

const routesIntl = {
  'login.get': loginGet,
  'message.create': messageCreate,
} as const

export type Routes = keyof typeof routesIntl

export const routes: Record<Routes, Route> = routesIntl
