export interface ChronocatConfig extends ChronocatCurrentConfig {
  /**
   * @title 账号配置
   *
   * 账号专属的配置。
   *
   * @default {}
   */
  overrides?: {
    [account: string]: ChronocatCurrentConfig
  }
}

export interface ChronocatCurrentConfig extends ChronocatEnableableConfig {
  /**
   * @title 服务
   *
   * Chronocat 需要启动的服务。
   *
   * @default []
   */
  servers?: (ChronocatRedServerConfig | ChronocatSatoriServerConfig)[]
}

export interface ChronocatServerConfig extends ChronocatEnableableConfig {
  /**
   * @title 密码
   *
   * 服务的密码。客户端使用服务时需要提供！
   */
  token: string
}

export interface ChronocatHttpServerConfig {
  /**
   * @title 监听地址
   *
   * 服务器监听的地址。
   *
   * 如果你不知道这是什么，那么不填此项即可！
   *
   * @default "0.0.0.0"
   */
  listen?: string
}

export interface ChronocatRedServerConfig
  extends ChronocatServerConfig,
    ChronocatHttpServerConfig {
  type: 'red'

  /**
   * @title 监听端口
   *
   * 服务器监听的端口。
   *
   * 默认为 16530。
   *
   * @default 16530
   * @minimum 1
   * @maximum 65535
   */
  port?: number
}

export interface ChronocatSatoriServerConfig
  extends ChronocatServerConfig,
    ChronocatHttpServerConfig {
  type: 'satori'

  /**
   * 服务器监听的端口。
   *
   * 默认为 5500。
   *
   * @default 5500
   * @minimum 1
   * @maximum 65535
   */
  port?: number
}

export interface ChronocatEnableableConfig {
  /**
   * @title 启用
   *
   * 是否启用这个功能。
   *
   * @default true
   */
  enable?: boolean
}
