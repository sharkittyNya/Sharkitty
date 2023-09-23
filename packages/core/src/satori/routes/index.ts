import { selfGet } from './self/get'
import type { Route } from './types'

const routesIntl = {
  'self.get': selfGet,
} as const

export type Routes = keyof typeof routesIntl

export const routes: Record<Routes, Route> = routesIntl
