import Ajv from 'ajv'
import standaloneCode from 'ajv/dist/standalone'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chronocatConfigSchema } from '../src/config.schema'

const ajv = new Ajv({
  code: {
    source: true,
  },
})
ajv.addKeyword('defaultProperties')
const validate = ajv.compile(chronocatConfigSchema)
const moduleCode = standaloneCode(ajv, validate).replace(
  /"use strict";module.exports = validate\d*;module.exports.default = (validate\d*);/,
  `//@ts-nocheck\n\nimport type { ValidateFunction } from 'ajv'\nimport type { ChronocatConfig } from '../config.types'\n\nexport const validate = $1 as ValidateFunction<ChronocatConfig>\n\n`,
)
void writeFile(join(__dirname, '../src/utils/config.validate.ts'), moduleCode)
