import { octal } from "../helpers"
import { Lexer } from "./lexer.js"
import { MemData, MemFillData } from "./memory"
import { Operators, Registers } from "./predefined.js"
import { ParseContext } from "./parse_context"

import { error, otherError, listForExtras } from "./util"

function optionalComment(line) {
  if (line.comment)
    return `\t\t${line.comment}`
  return ``
}

function tokens(toks) {
  return toks.map(t => t.text).join(``)
}

function labels(labs) {
  return labs.join(`\n`)
}

function t(str) {
  let len = str.length
  if (len === 0)
    len = 1
  return str.padEnd(8 * Math.floor((len + 7) / 8), ` `)
}

function convertOneLine(line) {
  switch (line.type) {
    case `BlankLine`:
      return line.comment || ``

    case `AssignmentLine`:
      return `${t(line.symbol)}${t(`=`)}${t(tokens(line.rhs))}${optionalComment(line)}`

    case `CodegenLine`:
      // eslint-disable-next-line max-len
      return `${t(labels(line.labels))}${t(line.opcode)}${t(tokens(line.rhs))}${optionalComment(line)}`
    
    default:
      throw new Error(`unhandled line type ${line.type}`)
  }
}

function convertAssembledToSource(assembled) {
  return assembled.map(convertOneLine).join(`\n`)
}

export class Parser {
  constructor(source_holder) {
    this.context = new ParseContext()
    this.lexer = new Lexer()
    this.code = source_holder.original_code
    this.holder = source_holder
    this.lexer.analyze(this.code)
    while (this.lexer.moreToCome()) {
      const line = this.parseLine()
      this.holder.createAndAddLine(line)
    }
  }

  static sourceFromAssembled(assembled) {
    return convertAssembledToSource(assembled)
  }

  //
  // Lexer interface
  //

  lookingAt(symType) {
    const sym = this.lexer.peekNotWS()
    return (sym.type === symType)
  }

  accept(symType) {
    if (this.lookingAt(symType))
      return this.lexer.next()
    else
      return null
  }

  expect(symType, context) {
    const sym = this.lexer.nextNotWS()
    if (sym.type === symType)
      return sym

    otherError(`expected ${symType} but got ${sym.type} ${context}`)
  }

  next() {
    return this.lexer.nextNotWS()
  }

  pushBack(sym) {
    this.lexer.pushBack(sym)
  }

  peek() {
    return this.lexer.peekNotWS()
  }

  // Interface to symbol table

  lookupSymbol(name) {
    return this.context.lookupSymbol(name)
  }


  collectTokens(callback) {
    const pos = this.lexer.position()
    const value = callback()
    const tokens = this.lexer.tokensFromPosition(pos)
    return { tokens, value }
  }

  //
  // Parsing

  parseLine() {
    let sym = this.next()
    let result = {}
    if (!sym)
      return

    let sol = this.lexer.position()

    switch (sym.type) {
      case `comment`:
        this.next()
        return {
          type: `BlankLine`,
          comment: sym.text,
        }

      case `NL`:
        return {
          type: `BlankLine`,
          comment: null,
        }

      case `label`:
      case `opcode`:
      case `directive`:
        result = this.parseLabelledLine(sym)
        break

      case `symbol`:
        const next = this.peek()
        if (next.type === `opcode`) {
          error(sym, `are you missing a ":" after "${sym.text}" and before "${next.text}"?`)
        }

        const { tokens, value } = this.parseAssignmentLine(sym)

        result = {
          type: `AssignmentLine`,
          symbol: sym.text,
          rhs: tokens,
          value,
        }
        break

      default:
        error(sym, `A line should start with a label, an opcode, a directive, or a symbol.`)
    }

    if (sym = this.accept(`comment`)) {
      result.comment = sym.text
    }

    const allTokens = this.lexer.tokensFromPosition(sol)
    result.lineText = allTokens.map(t => t.text).join(``)
 
    sym = this.next()
    if (sym && (sym.type !== `NL` && sym.type !== `EOF`)) {
      error(sym, `extra stuff at end of line`)
    }

    return result
  }

  parseExpression(next) {
    let value = this.parseTerm(next)
    let op

    while (op = this.accept(`binop`)) {
      const t = this.parseTerm(this.next())
      switch (op.text) {
        case `+`:
          value += t
          break
        case `-`:
          value -= t
          break
        case `*`:
          value *= t
          break
        case `/`:
          if (t === 0)
            otherError(`attempt to divide ${value} by zero`)
          value /= t 
          break
        case `&`:
          value &= t 
          break
        case `!`:
          value |= t 
          break
        default:
          error(op, `invalid binarey operartor`)
      }
    }
    return value & 0xffff
  }

  parseIntLiteral(number, base) {
    if (number.startsWith(`^`))
      number = number.slice(2)
    return Number.parseInt(number, base)
  }

  parseTerm(next) {
    let sign = 1
    let value
    let complement = false

    while (next.type === `binop` && (next.text === `+` || next.text === `-`)) {
      if (next.text === `-`)
        sign = -sign
      next = this.next()
    }

    if (next.type === `ones_complement`) {
      complement = true
      next = this.next()
    }

    switch (next.type) {
      case `octal_number`:
        value = this.parseIntLiteral(next.text, 8)
        break

      case `decimal_number`:
        value = this.parseIntLiteral(next.text, 10)
        break

      case `binary_number`:
        value = this.parseIntLiteral(next.text, 2)
        break

      case `bad_number`:
        otherError(`If you want "${next.text}" to be a decimal number, precede it with "^d"`)
        break

      case `open_expr_grp`:
        value = this.parseExpression(this.next())
        this.expect(`close_expr_grp`, `missing ">" at end of bracketed expression`)
        break

      case `symbol`:
        const sym = this.lookupSymbol(next.text)
        if (sym && sym.isDefined())
          value = sym.value
        else
          value = NaN
        break

      case `single_char`:
        value = next.text.charCodeAt(1)
        if (value > 127)
          error(next, `Sorry, only 8 bit characters are allowed`)
        break

      case `double_char`:
        const c1 = next.text.charCodeAt(1)
        const c2 = next.text.charCodeAt(1)
        if (c1 > 127 || c2 > 127)
          error(next, `Sorry, only 8 bit characters are allowed`)
        value = c2 << 8 | c1
        break

      default:
        error(next, `invalid start of an expression`)
        break

    }

    value *= sign
    if (complement)
      value = ~value
    return value

    //     'a
    //     "aa
    //     "<" expression ">"
  }

  parseDD(_operator, extraWords) {
    let next = this.next()
    let mode
    let register
    let deferred = 0
    let value

    if (next.type === `deferred`) {
      deferred = 1
      next = this.next()
    }

    switch (next.type) {

      case `register`:
        mode = 0
        register = Registers[next.text]
        break

      case `lparen`:
        next = this.expect(`register`, `after an "("`)
        register = Registers[next.text]

        if (this.accept(`autoinc`)) {
          mode = 2
        }
        else {
          this.expect(`rparen`, `after the register name`) 
          mode = 1
        }
        break

      case `autodec`:
        next = this.expect(`register`, `in autodecrement`)
        this.expect(`rparen`, ``)
        register = Registers[next.text]
        mode = 4
        break

      case `immediate`:
        value = this.parseExpression(this.next())
        extraWords.push(value)
        register = 7
        mode = 2
        break

      default:
        value = this.parseExpression(next)
        if (this.accept(`lparen`)) {   // exp(Rn)
          next = this.expect(`register`, `inside parentheses of relative address`)
          this.expect(`rparen`, `after register name`)
          extraWords.push(value)
          register = Registers[next.text]
          mode = 6
        }
        else {                      // exp -- relative mode
          extraWords.push(value - this.context.clc - 4 - 2 * extraWords.length)
          register = 7
          mode = 6
        }

    }

    return (mode | deferred) << 3 | register
  }

  parseOneOp(operator) {
    const extraWords = []
    const dd = this.parseDD(operator, extraWords)
    return {
      opEncoding: dd,
      extraWords,
    }

  }

  parseTwoOp1(operator) {
    const extraWords = []
    const op1 = this.parseDD(operator, extraWords)
    this.expect(`comma`, `after first operand`)
    const op2 = this.parseDD(operator, extraWords)

    return {
      opEncoding: op1 << 6 | op2,
      extraWords,
    }
  }

  parseTwoOp2(operator) {
    const extraWords = []
    const reg = this.expect(`register`, ``)
    this.expect(`comma`)
    const op2 = this.parseDD(operator, extraWords)

    return {
      opEncoding: Registers[reg.text] << 6 | op2,
      extraWords,
    }
  }

  parseBranch(_operator) {
    const target = this.next()
    let offset = this.parseExpression(target)
    offset -= (this.context.clc + 2)
    offset /= 2
    if (offset < -128 || offset > 127)
      error(target, `is too far away from this instruction (its offset is ${offset} words, ` +
        `and we're limited to an offset between -128 and +127 words`)
    return {
      opEncoding: offset & 0xff,
      extraWords: [],
    }
  }

  parseSob(_operator) {
    const reg = this.expect(`register`)
    this.expect(`comma`)
    const target = this.next()
    let offset = this.parseExpression(target)
    offset -= (this.context.clc + 2)
    offset /= 2
    if (offset < -128 || offset > 127)
      error(target, `is too far away from this instruction (its offset is ${offset} words, ` +
        `and we're limited to an offset between -128 and +127 words`)
    return {
      opEncoding: Registers[reg.text] << 8 | offset & 0xff,
      extraWords: [],
    }
  }

  parseJsr(operator) {
    const reg = this.expect(`register`)
    this.expect(`comma`)
    const target = this.parseDD(operator)
    return {
      opEncoding: Registers[reg.text] << 5 | target.dd,
      extraWords: listForExtras(target.extraWord),
    }
  }

  parseRts(_operator) {
    const reg = this.expect(`register`, `RTS takes a register operand`)
    return {
      opEncoding: Registers[reg.text],
      extraWords: [],
    }
  }

  parseTrap(_operator) {
    let value = 0
    let next = this.next()

    if (this.peek() === `NL`) {
      this.pushBack(next)
    }
    else {
      value = this.parseExpression(next)
      if (value > 255 || value < -256)
        error(next, `operand of a trap or emt can only be 8 bits (got ${value})`)
    }

    return {
      opEncoding: value,
      extraWords: [],
    }
  }

  parseOpcode(_opcode) {
    return {
      opEncoding: 0,
      extraWords: [],
    }
  }

  parseOpcodeLine(sym) {
    let opcode = sym.value
    const operator = Operators[opcode]
    let operands

    switch (operator.fmt) {
      case `OneOp`:   
        operands = this.parseOneOp(operator)
        break
      case `TwoOp1`: 
        operands = this.parseTwoOp1(operator)
        break
      case `TwoOp2`: 
        operands = this.parseTwoOp2(operator)
        break
      case `Branch`: 
        operands = this.parseBranch(operator)
        break
      case `Sob`:       
        operands = this.parseSob(operator)
        break
      case `Jsr`:       
        operands = this.parseJsr(operator)
        break
      case `Rts`:       
        operands = this.parseRts(operator)
        break
      case `Trap`:   
        operands = this.parseTrap(operator)
        break
      case `Opcode`:   
        operands = this.parseOpcode(operator)
        break
      default:
        throw new Error(`Unknown operand format: ${operator.fmt}`)
    }

    const instruction = operator.op | operands.opEncoding
    const words = this.context.addInstruction(instruction, operands.extraWords)
    const bytes = []
    words.forEach(w => {
      bytes.push(w & 0xff)
      bytes.push((w >> 8) & 0xff)
    })
    return bytes
  }


  parseDirectiveLine(sym) {
    let value
    let count
    let generatedBytes = []
    const pos = this.lexer.position()

    switch (sym.value) {
      case  `.ascii`:
      case  `.asciiz`:
      case  `.asciz`:
        const line = sym.text
        let offset = line.indexOf(` `)
        if (offset < 0) 
          error(sym, `a .ascii directive needs an argument`)

        while (offset < line.length && line[offset] === ` `)
          offset ++

        if (offset === line.length)
          error(sym, `an ascii directive requires an argument`)

        const delimiter = line[offset++]
        const start = offset

        while (offset < line.length && line[offset] !== delimiter)
          offset ++

        if (offset === line.length || line[offset] !== delimiter)
          error(sym, `couldn't find a matching delimiter («${delimiter}») at end of string`)

        if (offset < line.length && line[offset] === delimiter)
          offset++

        const end = offset
        const str = line.slice(start, offset - 1)

        while (offset < line.length && line[offset] === ` `)
          offset ++

        if (offset < line.length && line[offset] !== `;`)
          // eslint-disable-next-line max-len
          error(sym, `extra stuff («${line.slice(end)}») on line after closing delimiter («${delimiter}»)`)

        for (let i = 0; i < str.length; i++) {
          const ch = str.charCodeAt(i) 
          this.context.storeByteInMemory(ch, MemData)
          generatedBytes.push(ch)
        }

        if (sym.value.endsWith(`z`)) {
          this.context.storeByteInMemory(0, MemData)
          generatedBytes.push(0)
        }
        break

      case  `.blkb`:
      case  `.blkw`:
        if (this.lookingAt(`NL`)) {
          count = 1
        }
        else {
          count = this.parseExpression(this.next())
          if (count <= 0)
            error(sym, `the count should be positive`)
        }
        if (sym.text === `.blkw`)
          count *= 2

        this.context.clc += count
        break

      case  `.byte`:
        value = this.parseExpression(this.next())
        this.context.storeByteInMemory(value, MemData)
        generatedBytes.push(value)
        while (this.accept(`comma`)) {
          let value = this.parseExpression(this.next())
          this.context.storeByteInMemory(value, MemData)
          generatedBytes.push(value)
        }
        break

      case  `.end`:
        let ep = 0o1000
        if (!this.lookingAt(`NL`) && !this.lookingAt(`comment`) && !this.lookingAt(`EOF`)) {
          ep = this.parseExpression(this.next())
        }
        this.holder.start_address = ep
        break

      case  `.even`:
        if (this.context.clc & 1) {
          this.context.storeByteInMemory(0, MemFillData)
          generatedBytes.push(0)
        }

        break

      case  `.odd`:
        if ((this.context.clc & 1) === 0) {
          this.context.storeByteInMemory(0, MemFillData)
          generatedBytes.push(0)
        }
        break

      case  `.word`:
        value = this.parseExpression(this.next())
        this.context.storeWordInMemory(value, MemData)
        generatedBytes.push(value & 0xff)
        generatedBytes.push((value >> 8) & 0xff)

        while (this.accept(`comma`)) {
          let value = this.parseExpression(this.next())
          this.context.storeWordInMemory(value, MemData)
          generatedBytes.push(value & 0xff)
          generatedBytes.push((value >> 8) & 0xff)
        }
        break

      default:
        error(sym, `unknown directive`)
    }
    return {
      type: `DirectiveLine`,
      rhs: this.lexer.tokensFromPosition(pos),
      opcode: sym.text,
      generatedBytes,
    }
  }

  parseAssignmentLine(sym) {
    this.expect(`equals`)
    const { tokens, value } = this.collectTokens(_ => this.parseExpression(this.next()))
    this.context.addAssigned(sym.text, value)
    return { tokens, value }
  }

  parseLabelledLine(sym) {
    const labels = []
    let returnValue = {
      type: `JustLabels`,
    }


    while (sym && sym.type === `label`) {
      this.context.addLabel(sym.text)
      labels.push(sym.text)
      sym = this.next()
    }

    const address = this.context.clc

    switch (sym.type) {
      case `NL`:
      case `EOF`:
      case `comment`:
        break

      case `opcode`:
        const opResult = this.collectTokens(_ => this.parseOpcodeLine(sym))
        returnValue = {
          type: `OpcodeLine`,
          opcode: sym.text,
          rhs: opResult.tokens,
          generatedBytes: opResult.value,
        }
        break

      case `directive`:
        returnValue = this.parseDirectiveLine(sym)
        break

      default:
        error(sym, `Expecting an opcode or a directive after a label`)
    }

    if (sym.type === `comment`)  {
      returnValue.comment = sym.value
    }

    returnValue.labels = labels
    returnValue.address = address
    return returnValue

  }
}


