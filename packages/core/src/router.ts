type RouterOptions = {
  body: BodyType
}

const defaultRouterOption = {
  body: 'none',
} as const

type BodyType = 'binary' | 'json' | 'text' | 'none'
type RouterHandlerContext<RouterOption extends RouterOptions> = {
  body: RouterOption['body'] extends 'text'
    ? string
    : RouterOption['body'] extends 'json'
    ? unknown
    : RouterOption['body'] extends 'binary'
    ? ArrayBuffer
    : RouterOption['body'] extends 'none'
    ? undefined
    : unknown
}
type RouterHandler<RouterOption extends RouterOptions, T> = (
  ctx: RouterHandlerContext<RouterOption>,
) => T | Promise<T>

type AssignValueToKey<T, V, K extends keyof T> = {
  [P in keyof T]: P extends K ? V : T[P]
}

type RouterOptionsToDeclarator<RouterOption extends RouterOptions> = {
  [key in keyof RouterOptions as `$${string & key}`]: <
    Value extends RouterOptions[key],
  >(
    optionValue: Value,
  ) => RouterProxy<AssignValueToKey<RouterOption, Value, key>>
}

type Merge<T extends object, U extends { [key: string]: string }> = {
  [key in keyof T]: U[key & string] extends undefined
    ? T[key]
    : NonNullable<U[key & string]>
}
type Keys = {
  [key in keyof RouterOptions as `$${string & key}`]: unknown
}
type RouterOptionsDeclarators<RouterOption extends RouterOptions> =
  RouterOptionsToDeclarator<RouterOption>
type RouterProxy<RouterOption extends RouterOptions> = NonNullable<
  {
    <T extends Partial<RouterOptions>>(
      handler: RouterHandler<Merge<RouterOption, T>, unknown>,
      options?: T,
    ): undefined
  } & {
    [K in keyof Omit<never, keyof Keys>]: RouterProxy<RouterOption>
  } & {
    [K in keyof RouterOptionsDeclarators<RouterOption>]: RouterOptionsDeclarators<RouterOption>[K]
  }
>

export interface Route {
  path: string[]
  options: RouterOptions
  handler: <T>(ctx: RouterHandler<RouterOptions, T>) => T
}
const routes: Route[] = []

type MakeRouterProxyFn = (
  path: string[],
  options: RouterOptions,
) => RouterProxy<RouterOptions>
const makeRouterProxy: MakeRouterProxyFn = ((
  path: string[],
  options: RouterOptions,
) =>
  new Proxy(() => {}, {
    get(_, prop) {
      if (typeof prop === 'symbol') throw Error('Symbol is not supported')
      if (prop.startsWith('$')) {
        return (optionValue: string) =>
          makeRouterProxy(path, {
            ...options,
            [prop.slice(1)]: optionValue,
          })
      }
      return makeRouterProxy([...path, prop], options)
    },
    set(_, __, ___, ____) {
      throw Error('Cannot set property on router')
    },
    apply(
      _,
      __,
      [handler, applyOptions]: [
        RouterHandler<never, unknown>,
        Partial<RouterOptions>,
      ],
    ) {
      routes.push({
        path,
        options: {
          ...options,
          ...applyOptions,
        },
        handler,
      } as unknown as Route)
    },
  })) as unknown as MakeRouterProxyFn

export const router: RouterProxy<typeof defaultRouterOption> = makeRouterProxy(
  [],
  {
    body: 'none',
  },
) as unknown as RouterProxy<typeof defaultRouterOption>

router.a?.b?.c?.$body('none')(
  (ctx) => {
    ctx.body
  },
  {
    body: 'binary',
  },
)

console.log(routes)
