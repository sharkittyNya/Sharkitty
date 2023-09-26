import { publicDecrypt } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

void (async () => {
  console.log(
    publicDecrypt(
      await readFile(resolve(__dirname, '../packages/docs/static/ti.pub')),
      await readFile(process.argv[2]!),
    ).toString('utf-8'),
  )
})()
