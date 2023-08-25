import type { RouteResolver } from '../router'

export type RouterServerCommonConfig<AuthorizerInput> = {
  authorizer: (input: AuthorizerInput) => boolean | Promise<boolean>
}

export type ConfigOf<ConfigType> = Partial<ConfigType> &
  RouterServerCommonConfig<unknown>

export interface RouterServer<
  ConfigType extends RouterServerCommonConfig<unknown>,
> {
  createServer(
    resolveRoute: RouteResolver,
    config: ConfigOf<ConfigType>,
  ): RouterServerInstance
}

export interface RouterServerInstance {
  stop(): void
}

export type { RouteResolver }
