import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const processRelease = (s: string) =>
  s.replace(
    /v\d+\.\d+\.\d+/,
    '[$&](https://github.com/chrononeko/chronocat/releases/tag/$&)',
  )

const componentMap = {
  core: 'https://github.com/chrononeko/chronocat/tree/master/packages/core',
  docs: 'https://github.com/chrononeko/chronocat/tree/master/packages/docs',
  iife: 'https://github.com/chrononeko/chronocat/tree/master/packages/iife',
  llqqnt: 'https://github.com/chrononeko/chronocat/tree/master/packages/llqqnt',
  qqntim: 'https://github.com/chrononeko/chronocat/tree/master/packages/qqntim',
  red: 'https://github.com/chrononeko/chronocat/tree/master/packages/red',
  'koishi-plugin-adapter':
    'https://github.com/chrononeko/chronocat-js/tree/master/packages/adapter',
  'koishi-plugin-assets-memory':
    'https://github.com/chrononeko/chronocat-js/tree/master/packages/assets-memory',
}

const processComponent = (s: string) =>
  `### [${s.slice(4)}](${componentMap[s.slice(4)]})`

const processCommit = (s: string) =>
  s.replace(
    /\(([a-z\d]{8})([a-z\d]{32})\)/g,
    '([$1](https://github.com/chrononeko/chronocat/commit/$1$2))',
  )

const processUser = (s: string) =>
  s.replace(/@([\w\-.]*)/, '[$&](https://github.com/$1)')

void (async () => {
  const lines = (await readFile(resolve(__dirname, '../../../CHANGELOG.md')))
    .toString()
    .split('\n')

  const result = ['---', 'title: 更新日志', 'sidebar_position: 10000', '---']

  for (let line of lines) {
    // # CHANGELOG
    if (line.startsWith('# ')) continue

    if (line.startsWith('## ')) line = processRelease(line)
    else if (line.startsWith('### ')) line = processComponent(line)
    else line = processUser(processCommit(line))

    result.push(line)
  }

  await writeFile(
    resolve(__dirname, '../docs/community/changelog.mdx'),
    result.join('\n'),
  )
})()
