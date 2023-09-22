import type { ValidateFunction } from 'ajv'
import Ajv from 'ajv'
import localize from 'ajv-i18n/localize/zh'
import type { ChronocatConfig } from '../../config.types'
import { validate } from './validate'

export const parseConfig = (config: unknown, uin: string) => {
  if (!(validate as ValidateFunction<ChronocatConfig>)(config)) {
    localize((validate as ValidateFunction<ChronocatConfig>).errors)
    throw new Ajv().errorsText(
      (validate as ValidateFunction<ChronocatConfig>).errors,
      {
        separator: '\n',
      },
    )
  }

  return Object.assign({}, config, config.overrides?.[uin])
}
