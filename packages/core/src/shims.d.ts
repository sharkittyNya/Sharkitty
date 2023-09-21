declare const yamlData: string

declare module '*.yml' {
  // eslint-disable-next-line import/no-default-export
  export default yamlData
}
