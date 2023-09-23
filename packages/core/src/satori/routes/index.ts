import type { Route } from './types'

const routesIntl = {} as const

export type Routes = keyof typeof routesIntl

export const routes: Record<Routes, Route> = routesIntl
