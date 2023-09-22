declare const yamlData: string
declare const htmlData: Uint8Array

declare module '*.yml' {
  // eslint-disable-next-line import/no-default-export
  export default yamlData
}

declare module '*.html' {
  // eslint-disable-next-line import/no-default-export
  export default htmlData
}
