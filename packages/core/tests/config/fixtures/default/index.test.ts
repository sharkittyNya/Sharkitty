import { load } from 'js-yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ChronocatCurrentConfig } from '../../../../src/config.types'
import { parseConfig } from '../../../../src/utils/config/parser'

test('配置文件解析器应当正确解析 默认配置文件', async () => {
  expect.assertions(2)

  const raw = (await readFile(join(__dirname, 'chronocat.yml'))).toString()
  const config = load(raw)

  const parsed1 = parseConfig(config, '1')
  expect(parsed1).toEqual<ChronocatCurrentConfig>({
    enable: true,
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
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
    ],
  })

  const parsed10000 = parseConfig(config, '10000')
  expect(parsed10000).toEqual<ChronocatCurrentConfig>({
    enable: true,
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
        token: 'DEFINE_CHRONO_TOKEN',
        enable: true,
      },
    ],
  })
})
