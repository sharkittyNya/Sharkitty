# CHANGELOG

## v0.0.39 (2023-08-31)

### core

- 修复了文件上传和资源获取有概率失败的问题 @Hieuzest (#6)

## v0.0.38 (2023-08-30)

### core

- 接收到的聊天消息中现在会包含群成员身份组信息 @Hieuzest (#3)
- 修复了 HTTP API 无法使用的问题
- 修复了文件上传的问题

## v0.0.37 (2023-08-26)

### core

- 修复了一个问题，该问题会导致首次使用 Chronocat 时不会自动创建 token 文件 (ad8b570bd7d41ecc9ac600421c34b5bb8049e3f5)

## v0.0.36 (2023-08-26)

### core

- 完全重构了 Chronocat Core

### red

- 添加 Payload 相关类型

### llqqnt

- 首个版本

### qqntim

- 首个版本

### iife

- 首个版本

### koishi-plugin-adapter

- 拆分了资源存储逻辑

### koishi-plugin-assets-memory

- 首个版本

## v0.0.35 (2023-08-11)

### koishi-plugin-adapter

- 修复了一些小的问题并提升了稳定性

## v0.0.34 (2023-08-04)

### core

- 更新了 Chronocat 核心

## v0.0.33 (2023-08-04)

### core

- 更新了 Chronocat 核心

## v0.0.32 (2023-07-31)

### core

- 更新了 Chronocat 核心

## v0.0.31 (2023-07-30)

### core

- 更新了 Chronocat 核心

## v0.0.30 (2023-07-27)

### koishi-plugin-adapter

- 撤回了将 chronocatAssets 服务提升至 host 插件的更改，因为这会导致问题

## v0.0.29 (2023-07-27)

### koishi-plugin-adapter

- 支持了 session 上的 avatar 字段
- 修复了一个问题，该问题会导致群聊无法发送消息

## v0.0.28 (2023-07-26)

### core

- 更新了 Chronocat 核心

### koishi-plugin-adapter

- 更新了插件配置
- 将 chronocatAssets 服务提升至 host 插件
- 修复了处理消息过慢的问题

## v0.0.27 (2023-07-25)

### core

- 更新了 Chronocat 核心

### koishi-plugin-adapter

- 实现接收文件
- 实现接收语音消息
- 实现接收视频消息
- 实现「群组内群员被禁言」事件
- 支持 `session.isDirect`
- 修复了处理消息过慢的问题

## v0.0.26 (2023-07-24)

### koishi-plugin-adapter

- 俢復孒①些尒哋問趧並諟圱孒穏萣悻

## v0.0.25 (2023-07-23)

### koishi-plugin-adapter

- 开发流程启用 TDD 模式：现在，开发 Chronocat 时无需启动 Chronocat、Koishi 或 QQ
- 支持「旧版群成员邀请新人入群」事件
- 修复了「新人自行入群」事件不触发的问题

### koishi-plugin-launcher

- 启动器适配 QQ v9.9.1.15293

## v0.0.24 (2023-07-21)

### koishi-plugin-adapter

- 修复了一个表情混排消息导致消息解析出错的问题
- 修复图片接收问题

### koishi-plugin-launcher

- 移除了第一代启动器
- 更新了 Chronocat 核心
- 修复了 QQ 无限转圈的问题

## v0.0.23 (2023-07-20)

### koishi-plugin-adapter

- 使用 host 插件作为入口点
- 俢復孒①些尒哋問趧並諟圱孒穏萣悻

### koishi-plugin-launcher

- 默认使用 Chronocat 第二代启动器
- 启动器适配 QQ v9.9.1.15240
- 启动器支持 Windows ARM / Linux ARM

## v0.0.22 (2023-07-19)

### koishi-plugin-adapter

- 现在，在 session 存在字段缺失时会给出警告。在反馈问题时，请携带相关错误码进行反馈。
- 实现 getMessageList
- 实现 getGuild、getGuildList
- 检测群名称变更事件
- 修复图片接收错误

## v0.0.21 (2023-07-19)

### koishi-plugin-launcher

- 支持 Chronocat 第二代启动器

## v0.0.20 (2023-07-17)

### koishi-plugin-adapter

- 俢復孒①些尒哋問趧並諟圱孒穏萣悻

## v0.0.19 (2023-07-14)

### koishi-plugin-adapter

- 修复了一些小的问题并提升了稳定性

## v0.0.18 (2023-07-14)

### core

- 更新了 Chronocat 核心

## v0.0.17 (2023-07-13)

### koishi-plugin-adapter

- 现在，每个已弃用或未实现的 API 都配备了专属的错误码。在反馈问题时，请携带相关错误码进行反馈。
- 不再解析 ark 消息
- 修复了接收到的图片 URL 中出现 undefined 的问题
- 修复了使用 bot.sendMessage() 无法主动发送群聊消息的问题
- 修复了一些小的问题并提升了稳定性

## v0.0.16 (2023-07-11)

### koishi-plugin-adapter

- 修复了 adapter 无法加载的问题

## v0.0.15 (2023-07-11)

### koishi-plugin-adapter

- 添加了更多 API

## v0.0.14 (2023-07-11)

### core

- 更新 Chronocat 核心到 v1.0.1

## v0.0.13 (2023-07-11)

### koishi-plugin-adapter

- 优化了消息解析逻辑

## v0.0.12 (2023-07-09)

### koishi-plugin-adapter

- 优化了消息解析逻辑
- 修复了入群提醒判断不正确的问题

## v0.0.11 (2023-07-09)

### koishi-plugin-adapter

- 优化了消息解析逻辑
- 修复了 `jpeg` 图片无法正常发送的问题

## v0.0.10 (2023-07-09)

### koishi-plugin-adapter

- 重构了消息解析逻辑

## v0.0.9 (2023-07-09)

### koishi-plugin-adapter

- 支持新成员入群事件
- 修复图片发送逻辑

### koishi-plugin-launcher

- 修复 launcher 插件导致 QQ 无限转圈的问题

## v0.0.8 (2023-07-08)

### koishi-plugin-adapter

- 接收到的 at 元素添加 name 属性

### koishi-plugin-launcher

- 修复了 launcher 无法检测 QQ 是否正在运行的问题

## v0.0.7 (2023-07-07)

### koishi-plugin-adapter

- 适配最新版 Koishi Desktop
- 实现发送 at 消息
- 推荐使用 `OneBotCL` API
- 修复了 v0.0.5 版本无法使用的问题

### koishi-plugin-launcher

- 优化了启动逻辑

## v0.0.6 (2023-07-06)

### koishi-plugin-adapter

- 修复了 v0.0.5 版本无法使用的问题

## v0.0.5 (2023-07-04)

### koishi-plugin-adapter

- 实现接收 at 消息
- 实现发送 base64 图片

## v0.0.4 (2023-07-03)

### koishi-plugin-launcher

- 实装 launcher

## v0.0.3 (2023-07-02)

### koishi-plugin-adapter

- 修复了一些小的问题并提升了稳定性

## v0.0.2 (2023-07-02)

### koishi-plugin-adapter

- 修复了一些小的问题并提升了稳定性

## v0.0.1 (2023-07-01)

### koishi-plugin-adapter

- 首个版本
