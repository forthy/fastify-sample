import { serverOf } from '@server'
import { describe, expect, it } from 'vitest'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { fail } from 'assert'
import { readServerAddressFromEnv } from '@configurations'

describe('Test server', () => {
  it('server should start and close', () => {
    const server = serverOf({ logger: true })
    
    pipe(
      readServerAddressFromEnv(),
      O.match(
        () => fail('Please check if you configured the server IP and port'),
        async (c) => {
          await pipe(
            server.start(c),
            TE.match(
              (e) => fail(`Server start error: ${JSON.stringify(e)}`),
              (r) => expect(r).toBeUndefined()
            )
          )()

          await pipe(
            server.close(),
            TE.match(
              (e) => fail(`Server close error: ${JSON.stringify(e)}`),
              (r) => expect(r).toBeUndefined()
            )
          )()
        }
      )
    )
  })
})
