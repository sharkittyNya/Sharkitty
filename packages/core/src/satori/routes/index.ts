import { loginGet } from './login/get'
import type { Route } from './types'

const routesIntl = {
  'login.get': loginGet,
} as const

export type Routes = keyof typeof routesIntl

export const routes: Record<Routes, Route> = routesIntl
