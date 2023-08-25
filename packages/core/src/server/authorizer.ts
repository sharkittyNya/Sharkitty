import type { IncomingMessage } from 'http'

export const HeaderAuthorizer = (token) => (req: IncomingMessage) =>
  req.headers.authorization?.slice(0, 7) === 'Bearer ' &&
  req.headers.authorization.slice(7) === token
