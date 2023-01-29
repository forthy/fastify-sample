import fastify, { FastifyServerOptions } from 'fastify'
import fastifyFunky from '@fastify/funky'
import * as TE from 'fp-ts/TaskEither'
import { pipe, constVoid } from 'fp-ts/function'
import { ServerAddressConfig, portTo, ipTo } from '@configurations'

export type ServerStartError = { _tag: 'ServerStartError'; port: number; msg: string }
export type ServerCloseError = { _tag: 'ServerCloseError'; msg: string }
export type ServerError = ServerStartError | ServerCloseError

const serverStartErrorOf: (port: number) => (e: Error) => ServerStartError = (port) => (e) => ({
  _tag: 'ServerStartError',
  port,
  msg: `Server failed to start, port: ${port} - ${JSON.stringify(e, null, 2)}`,
})
const serverCloseErrorOf: (e: Error) => ServerCloseError = (e) => ({
  _tag: 'ServerCloseError',
  msg: `Server failed to close - ${JSON.stringify(e, null, 2)}`,
})

export type Server = {
  start: (config: ServerAddressConfig) => TE.TaskEither<ServerError, void>
  close: () => TE.TaskEither<ServerError, void>
}

export const serverOf: (opt: FastifyServerOptions) => Server = (opt) => {
  const server = fastify(opt)

  server.register(fastifyFunky)

  return {
    start: (config: ServerAddressConfig) => {
      const port = portTo(config.port)
      const host = ipTo(config.ip)

      return pipe(
        TE.tryCatch(
          () => server.listen({ port, host }),
          (e) => serverStartErrorOf(port)(e as Error)
        ),
        TE.map(constVoid)
      )
    },
    close: () =>
      pipe(
        TE.tryCatch(
          () => server.close(),
          (e) => serverCloseErrorOf(e as Error)
        ),
        TE.map(constVoid)
      ),
  }
}
