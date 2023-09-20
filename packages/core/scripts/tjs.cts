import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateSchema, getProgramFromFiles } from 'typescript-json-schema'

const program = getProgramFromFiles([
  resolve(__dirname, '../src/config.types.ts'),
])

const schema = generateSchema(program, 'ChronocatConfig')!

schema.$id = 'https://chronocat.vercel.app/config-v0.schema.json'
schema.title = 'Chronocat 配置'
schema.description = 'Chronocat 配置（chronocat.yml）'

void writeFile(
  resolve(__dirname, '../src/config.schema.ts'),
  `export const chronocatConfigSchema = ${JSON.stringify(schema)}\n`,
)
void writeFile(
  resolve(__dirname, '../../docs/static/config-v0.schema.json'),
  JSON.stringify(schema),
)
