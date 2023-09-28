export type WebSocketIncomingMessage =
  | WebSocketIncomingHeartbeatMessage
  | WebSocketIncomingVerifyMessage

export enum Op {
  Event = 0,
  Ping = 1,
  Pong = 2,
  Identify = 3,
  Ready = 4,
}

export interface WebSocketIncomingHeartbeatMessage {
  op: Op.Ping
  body: never
}

export interface WebSocketIncomingVerifyMessage {
  op: Op.Identify
  body?: {
    token?: string
  }
}

export interface Event {
  /**
   * 事件 ID
   */
  id: number

  /**
   * 事件类型
   */
  type: string

  /**
   * 接收者的平台名称
   */
  platform: string

  /**
   * 接收者的平台账号
   */
  self_id: string

  /**
   * 事件的时间戳
   */
  timestamp: number

  /**
   * 事件所属的频道
   */
  channel?: Channel

  /**
   * 事件所属的群组
   */
  guild?: Guild

  /**
   * 事件的登录信息
   */
  login?: Login

  /**
   * 事件的目标成员
   */
  member?: Member

  /**
   * 事件的消息
   */
  message?: Message

  /**
   * 事件的操作者
   */
  operator?: User

  /**
   * 事件的目标角色
   */
  role?: Role

  /**
   * 事件的目标用户
   */
  user?: User
}

export interface Channel {
  /**
   * 频道 ID
   */
  id: string

  /**
   * 频道名称
   */
  name: string

  /**
   * 频道类型
   */
  type: ChannelType

  /**
   * 父频道 ID
   */
  parent_id: string

  /**
   * 不安全的频道头像
   */
  avatar: string
}

export enum ChannelType {
  /**
   * 文本频道
   */
  TEXT = 0,

  /**
   * 语音频道
   */
  VOICE = 1,

  /**
   * 分类频道
   */
  CATEGORY = 2,

  /**
   * 私聊频道
   */
  DIRECT = 3,
}

export interface Guild {
  /**
   * 群组 ID
   */
  id: string

  /**
   * 群组名称
   */
  name: string

  /**
   * 不安全的群组头像
   */
  avatar: string
}

export interface Login {}

export interface Member {
  /**
   * 用户对象
   */
  user?: User

  /**
   * 用户在群组中的名称
   */
  name?: string

  /**
   * 用户在群组中的头像
   */
  avatar?: string
}

export interface Message {
  /**
   * 消息 ID
   */
  id: string

  /**
   * 消息内容
   */
  content: string

  /**
   * 频道对象
   */
  channel?: Channel

  /**
   * 群组对象
   */
  guild?: Guild

  /**
   * 成员对象
   */
  member?: Member

  /**
   * 用户对象
   */
  user?: User

  /**
   * 消息发送的时间戳
   */
  created_at?: number

  /**
   * 消息修改的时间戳
   */
  updated_at?: number
}

export interface User {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户名称
   */
  name: string
  /**
   * 用户头像
   */
  avatar?: string
  /**
   * 是否为机器人
   */
  is_bot?: boolean
}
