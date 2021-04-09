import Moo from "moo"

import { Opcodes, Directives, Registers } from "./predefined"

export class Lexer {

  constructor() {

    const symbol = `[a-z.$][a-z0-9.$]*` 

    this.lexer = Moo.compile({
      WS:              /[ \t]+/,
      comment:         /;.*?$/,
      label:           new RegExp(symbol + `:`),
      ones_complement: `^c`,
      bad_number:      /[0-7]*[89][0-9]*/,
      octal_number:    /[0-7]+|\^o[0-7]+/,
      binary_number:   /\^b[01]+/,
      decimal_number:  /\^d[0-9]+/,
      float_number:    /\^f[0-9]\.[0-9]/,
      equals:          `=`,
      comma:           `,`,
      single_char:     /'./,
      double_char:     /"../,
      immediate:       `#`,
      deferred:        `@`,
      open_expr_grp:   `<`,
      close_expr_grp:  `>`,
      autoinc:         `)+`,
      autodec:         `-(`,
      lparen:          `(`,
      rparen:          `)`,
      binop:           /[-+*/&!]/,

      directive: {
        match: /\.ascii?z?\b[^\n]*/,
        value: s => s.split(/\s+/, 1)[0],
      },

      symbol:  {
        match: new RegExp(symbol), 
        type: Moo.keywords({ 
          opcode:    Opcodes,
          directive: Directives,
          register:  Object.keys(Registers),
        }),
      },
      NL :     { match: /\n/, lineBreaks: true },
      "Unknown character":  /./,
    })
    this.tokens = []
  }

  analyze(text) {
    this.lexer.reset(text)
    this.tokens = Array.from(this.lexer)
    this.rewind()
  }

  rewind() {
    this.offset = 0
  }

  moreToCome() {
    return this.offset < this.tokens.length
  }

  next() {
    const token = this.peek()
    this.offset++
    return token
  }

  peek() {
    const token = this.tokens[this.offset]
    if (token)
      return token

    return {
      type: `EOF`,
    }
  }

  peekNotWS() {
    let sym = this.peek()
    while (sym && (sym.type === `WS`)) {
      this.offset++
      sym = this.peek()
    }
    return sym
  }

  nextNotWS(_lexer) {
    let sym = this.peekNotWS()
    if (sym)
      this.offset++

    return sym
  }

  pushBack(sym) {
    this.offset--
    if (this.tokens[this.offset] !== sym)
      throw new Error(`pushback error`)
  }

  position() {
    return this.offset
  }

  tokensFromPosition(pos) {
    // if (pos < this.tokens.length && this.tokens[pos].type === `WS`)
    //   pos++

    return this.tokens.slice(pos, this.offset)
  }

}



