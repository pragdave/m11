import { LexToken } from "./lexer"

export class ParseError {

  message: string
  line: number
  col: number
  symType: string
  symText: string

  constructor(message: string, sym = undefined) {
    this.message = message
    if (sym) {
      this.line = sym.line
      this.col = sym.col
      this.symType = sym.type
      this.symText = sym.text
    }
  }
}

export function otherError(msg: string) {
  console.error(msg)
  throw new ParseError(msg)
}

export function error(sym: LexToken, msg: string) {
  console.error(msg)
  console.info(`${sym.line}:${sym.col}  Looking at «${sym.text}» (type ${sym.type})`)
  throw new ParseError(msg, sym)
}

export function listForExtras<T>(...extras: T[]) {
  return extras.reduce((result, next) => {
    if (next !== undefined)
      result.push(next)
    return result
  },
  []
  )
}

export function octal(n: number) {
  return (n & 0xffff).toString(8).padStart(6, `0`)
}


