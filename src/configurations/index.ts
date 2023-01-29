import { Predicate, and } from 'fp-ts/Predicate'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import * as I from 'fp-ts/IO'
import * as E from 'fp-ts-std/Env'
import { memoize } from 'fp-ts-std/Lazy'
import { Newtype, prism, iso } from 'newtype-ts'
import { isPositiveInteger } from 'newtype-ts/lib/PositiveInteger'
import { isNonEmptyString } from 'newtype-ts/lib/NonEmptyString'
import { isIP } from 'net'
import * as dotenv from 'dotenv'

export interface Port extends Newtype<{ readonly Port: unique symbol }, number> {}
export interface IP extends Newtype<{ readonly IP: unique symbol }, string> {}

export type ServerAddressConfig = {
  ip: IP
  port: Port
}

const isNotNullishStr: Predicate<string> = (v: string) => !!v
const isValidIPStr: Predicate<string> = (v: string) => isIP(v) !== 0
const portIso = iso<Port>()
const ipPrism = prism<IP>(pipe(isNotNullishStr, and(isNonEmptyString), and(isValidIPStr)))

const verifyPortAsInt: Predicate<number> = (v) => !isNaN(v) && isPositiveInteger(v)
const convertStr2Int: (v: string) => O.Option<number> = (v) => pipe(Number(v), O.fromPredicate(verifyPortAsInt))
const readPortFromEnv: () => O.Option<Port> = () => pipe(E.getParam('PORT'), OT.chainOptionK(I.Monad)(portFrom))()
const readIPFromEnv: () => O.Option<IP> = () => pipe(E.getParam('IP'), OT.chainOptionK(I.Monad)(ipFrom))()

export const serverAddressConfigOf: (ip: IP) => (port: Port) => ServerAddressConfig = (ip) => (port) => ({ ip, port })
export const readServerAddressFromEnv: () => O.Option<ServerAddressConfig> = memoize(() =>
  pipe(dotenv.config(), () => O.of(serverAddressConfigOf), O.ap(readIPFromEnv()), O.ap(readPortFromEnv()))
)

export const portFrom: (v: string) => O.Option<Port> = (v) => pipe(convertStr2Int(v), O.map(portIso.wrap))
export const portTo: (v: Port) => number = (v) => portIso.unwrap(v)

export const ipFrom: (v: string) => O.Option<IP> = (v) => ipPrism.getOption(v)
export const ipTo: (v: IP) => string = (v) => ipPrism.reverseGet(v)
