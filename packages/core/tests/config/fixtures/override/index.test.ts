import { load } from 'js-yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseConfig } from '../../../../src/config/parser'
import type { ChronocatCurrentConfig } from '../../../../src/config/types'

test('配置文件解析器应当正确解析 被覆写的默认值', async () => {
  expect.assertions(2)

  const raw = (await readFile(join(__dirname, 'chronocat.yml'))).toString()
  const config = load(raw)

  const parsed1 = parseConfig(config, '1')
  expect(parsed1).toEqual<ChronocatCurrentConfig>({
    enable: false,
    servers: [
      {
        type: 'red',
        listen: '0.0.0.0',
        port: 16530,
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
      {
        type: 'satori',
        listen: '0.0.0.0',
        port: 5500,
        self_url: 'https://chronocat.vercel.app',
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
    ],
  })

  const parsed10000 = parseConfig(config, '10000')
  expect(parsed10000).toEqual<ChronocatCurrentConfig>({
    // 虽然 enable 的默认值为 true，但由于 10000 账号的配置并未覆写 enable，所以此值仍应为 false
    enable: false,
    servers: [
      {
        type: 'red',
        listen: '0.0.0.0',
        port: 16531,
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
      {
        type: 'satori',
        listen: '0.0.0.0',
        port: 5501,
        self_url: 'https://chronocat.vercel.app',
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
    ],
  })
})
