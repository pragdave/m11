import { compile, keywords, Lexer, Token } from "moo"
import { Opcodes, Directives, Registers } from "./predefined"

export interface LexToken {
  line: number
  col: number
  type: string
  text?: string
}

export class PDPLexer {

  private lexer: Lexer
  private tokens: LexToken[]
  private offset: number 


  constructor() {

    const symbol = `[a-z.$][a-z0-9.$]*` 

    this.lexer = compile({
      WS:              /[ \t]+/,
      comment:         /;.*?$/,
      label:           new RegExp(symbol + `:`),
      ones_complement: `^c`,
      bad_number:      /[0-7]*[89][0-9]*/,
      octal_number:    /[0-7]+|\^o[0-7]+/,
      binary_number:   /\^b[01]+/,
      decimal_number:  /\^d[0-9]+/,
      hex_number:      /\^x[0-9A-Fa-f]+/,
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

      ascii: {
        match: /\.ascii?z?\b[^\n]*/,
      },

      symbol:  {
        match: new RegExp(symbol), 
        type: keywords({ 
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

  analyze(text: string) {
    this.lexer.reset(text)
    this.tokens = Array.from(this.lexer).map(t => {
      return {
        line: t.line,
        col:  t.col,
        type: t.type,
        text: t.text,
      }
    })
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

  peek(): LexToken {
    const token = this.tokens[this.offset]
    if (token)
      return token

    if (this.offset > 0) {
      const prev = this.tokens[Math.min(this.tokens.length, this.offset) - 1]
      return { type: `EOF`, line: prev.line, col: prev.col }
    }

    return { type: `EOF`, line: 1, col: 0 }
  }

  peekNotWS(): LexToken {
    let sym = this.peek()
    while (sym && (sym.type === `WS`)) {
      this.offset++
      sym = this.peek()
    }
    return sym
  }

  nextNotWS() {
    let sym = this.peekNotWS()
    if (sym)
      this.offset++

    return sym
  }

  pushBack(sym: LexToken) {
    this.offset--
    if (this.tokens[this.offset] !== sym)
      throw new Error(`pushback error`)
  }

  position() {
    return this.offset
  }

  tokensFromPosition(pos: number) {
    // if (pos < this.tokens.length && this.tokens[pos].type === `WS`)
    //   pos++

    return this.tokens.slice(pos, this.offset)
  }

}



