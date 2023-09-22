import { load } from 'js-yaml'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseConfig } from '../../../../src/utils/config/parser'

test('配置文件解析器应当正确解析 空文件', async () => {
  expect.assertions(1)

  const raw = (await readFile(join(__dirname, 'chronocat.yml'))).toString()
  const config = load(raw)

  try {
    parseConfig(config, '1')
  } catch (e) {
    expect(e).toBe('data 应当是 object 类型')
  }
})
