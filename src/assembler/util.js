export class ParseError {

  constructor(message, sym = undefined) {
    this.message = message
    if (sym) {
      this.line = sym.line
      this.col = sym.col
      this.symType = sym.type
      this.symText = sym.text
    }
  }
}

export function otherError(msg) {
  console.error(msg)
  throw new ParseError(msg)
}

export function error(sym, msg) {
  console.error(msg)
  console.info(`${sym.line}:${sym.col}  Looking at «${sym.text}» (type ${sym.type})`)
  throw new ParseError(msg, sym)
}

export function listForExtras(...extras) {
  return extras.reduce((result, next) => {
    if (next !== undefined)
      result.push(next)
    return result
  },
  []
  )
}

export function octal(n) {
  return (n & 0xffff).toString(8).padStart(6, `0`)
}


