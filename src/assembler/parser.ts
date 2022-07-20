// impor { octal } from "../helpers"
import { PDPLexer, LexToken } from "./lexer"
import { MemInstruction, MemData, MemFillData } from "./memory"
import { Operators, Registers } from "./predefined"
import { ParseContext } from "./parse_context"
import { RawLineInfo, AssembledLine, ISourceLine, ICodegenLine, SourceCode } from "../shared_state/source_code" 
import { ParseError, error, otherError, listForExtras } from "./util"

type OpAndExtra = { opEncoding: number, extraWords: number[] }

function optionalComment(line: ISourceLine) {
  if (line.comment)
    return `\t\t${line.comment}`
  return ``
}

function tokens(toks: LexToken[]) {
  return toks.map(t => t.text).join(``)
}

function labels(labs: string[]) {
  return labs.join(`\n`)
}

function t(str: string) {
  str = str.trim()
  let len = str.length
  if (len === 0)
    len = 1
  return str.padEnd(8 * Math.floor((len + 7) / 8), ` `)
}

function convertOneLine(line: AssembledLine): string {
  switch (line.type) {
    case `BlankLine`:
      return line.comment || ``

    case `AssignmentLine`:
      return `${t(line.symbol)}${t(`=`)}${t(tokens(line.rhs))}${optionalComment(line)}`

    case `CodegenLine`:
      // eslint-disable-next-line max-len
      return `${t(labels(line.labels))}${t(line.opcode)}${t(tokens(line.rhs))}${optionalComment(line)}`

    case `ErrorLine`:
      return line.lineText

    default:
      throw new Error(`unhandled line type ${line}`)
  }
}

function convertAssembledToSource(assembled: SourceCode) {
  return assembled.sourceLines.map(l => convertOneLine(l)).join(`\n`)
}

export class Parser {
  context: ParseContext
  lexer: PDPLexer
  holder: SourceCode

  passNumber: number

  constructor(source: string) {
    this.context = new ParseContext()
    this.lexer = new PDPLexer()
    this.lexer.analyze(source)
    this.holder = new SourceCode(source)
  }

  assemble() {
    this.passNumber = 0
    this.doAPass()

    if (this.context.hasForwardReferences())
      this.doAPass()

    return this.holder
  }

  doAPass() {
    this.context.resetBeforePass()
    this.lexer.rewind()
    this.holder.reset()

    //    console.log(`Pass:`, this.passNumber)
    this.passNumber++

    while (this.lexer.moreToCome()) {
      const line = this.parseLine()
      if (line)
        this.holder.createAndAddLine(line)
    }

    this.holder.recordUnresolvedNames(this.context.unresolvedForwardReferences())
  }

  static sourceFromAssembled(assembled: SourceCode) {
    return convertAssembledToSource(assembled)
  }

  //
  // Lexer interface
  //

  lookingAt(symType: string) {
    const sym = this.lexer.peekNotWS()
    return (sym.type === symType)
  }

  lookingAtWS() {
    const sym = this.lexer.peek()
    return (sym.type === `WS`)
  }

  accept(symType: string) {
    if (this.lookingAt(symType))
      return this.lexer.next()
    else
      return null
  }

  expect(symType: string, context="") {
    const sym = this.lexer.nextNotWS()
    if (sym.type === symType)
      return sym

    error(sym, `expected ${symType} but got ${sym.type} ${context}`)
  }

  next() {
    return this.lexer.nextNotWS()
  }

  pushBack(sym: LexToken) {
    this.lexer.pushBack(sym)
  }

  peek() {
    return this.lexer.peekNotWS()
  }

  swallowRestOfLine() {
    let sym = this.lexer.peek()
    while (sym && sym.type !== `NL` && sym.type !== `EOF`)
      sym = this.next()
  }

  // Interface to symbol table

  lookupSymbol(name: string) {
    return this.context.lookupSymbol(name)
  }

  skipWS() {
    if (this.lookingAtWS()) {
      this.lexer.next()  
    }
  }

  collectTokens(callback: () => any) {
    const pos = this.lexer.position()
    const value = callback()
    const tokens = this.lexer.tokensFromPosition(pos)
    return { tokens, value }
  }

  //
  // Parsing

  parseLine(): RawLineInfo {
    let sol = this.lexer.position()

    this.skipWS()

    let sym = this.next()
    let sourceLineNumber = sym.line

    let result: RawLineInfo

    if (!sym || sym.type === `EOF`)
      return null


    try {
      switch (sym.type) {
        case `comment`:
          this.next()
          return {
            line: sourceLineNumber,
            type: `BlankLine`,
            height_in_lines: 1,
            comment: sym.text,
          }

        case `NL`:
          return {
            line: sourceLineNumber,
            type: `BlankLine`,
            height_in_lines: 1,
            comment: null,
          }

        case `label`:
        case `opcode`:
        case `directive`:
        case `ascii`:
          result = this.parseLabelledLine(sym)
          break

        case `symbol`:
          const next = this.peek()
          if (next.type === `opcode` || next.type === `directive`) {
            error(sym, `are you missing a ":" after "${sym.text}" and before "${next.text}"?`)
          }

          const { tokens, value } = this.parseAssignmentLine(sym)

          result = {
            line: sourceLineNumber,
            type: `AssignmentLine`,
            symbol: sym.text,
            rhs: tokens,
            height_in_lines: 1,
            value,
          }
          break

        default:
          error(sym, `A line should start with a label, an opcode, a directive, or a symbol.`)
      }

      if (sym = this.accept(`comment`)) {
        result.comment = sym.text
      }
    
      sym = this.next()
      
      if (sym && (sym.type !== `NL` && sym.type !== `EOF`)) {
        error(sym, `extra stuff at end of line`)
      }
    }
    catch (e) {
      if (!(e instanceof ParseError))
        throw e

      this.swallowRestOfLine()
    
      const allTokens = this.lexer.tokensFromPosition(sol)
     console.log(allTokens) 
      result = {
        type: `ErrorLine`,
        height_in_lines: 1,
        message: e.message,
        line:    e.line,
        col:     e.col,
        symType: e.symType,
        symText: e.symText,
        lineText: allTokens.map(t => t.text).join(``)
      }
    }

    return result
  }

  parseExpression(next: LexToken) {
    let value = this.parseTerm(next)
    let op: LexToken

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
          error(op, `invalid binary operator`)
      }
    }

    if (isNaN(value))
      return value

    return value & 0xffff
  }

  parseIntLiteral(number: string, base: number) {
    if (number.startsWith(`^`))
      number = number.slice(2)
    return Number.parseInt(number, base)
  }

  parseTerm(next: LexToken) {
    let sign = 1
    let value: number
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

      case `hex_number`:
        value = this.parseIntLiteral(next.text, 16)
        break

      case `binary_number`:
        value = this.parseIntLiteral(next.text, 2)
        break

      case `bad_number`:
        error(next, `If you want "${next.text}" to be a decimal number, precede it with "^d"`)
        break

      case `open_expr_grp`:
        value = this.parseExpression(this.next())
        this.expect(`close_expr_grp`, `missing ">" at end of bracketed expression`)
        break

      case `symbol`:
        const sym = this.lookupSymbol(next.text)
        if (sym && sym.isDefined())
          value = sym.value
        else {
          value = NaN
          if (this.passNumber > 1) {
            error(next, `pass ${this.passNumber} "${next.text}" is not defined`)
          }
          this.context.addForwardReference(next.text, next.line)
        }
        break

      case `single_char`:
        value = next.text.charCodeAt(1)
        if (value > 127)
          error(next, `Sorry, only 8 bit characters are allowed`)
        break

      case `double_char`:
        const c1 = next.text.charCodeAt(1)
        const c2 = next.text.charCodeAt(2)
        
        if (c1 > 127 || c2 > 127)
          error(next, `Sorry, only 7 bit characters are allowed`)
        value = c2 << 8 | c1
        break

      default:
        if (next.type === `EOF` || next.type === `NL` || next.type === `comment`)
          error(next, `missing expression`)
        else
          error(next, `invalid start of expression`)
        break

    }

    if (isNaN(value))
      return value

    value *= sign
    if (complement)
      value = ~value
    return value & 0xffff

    //     'a
    //     "aa
    //     "<" expression ">"
  }

  parseDD(extraWords: number[]) {
    let next = this.next()
    let mode: number
    let register: number
    let deferred = 0
    let value: number

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

  parseOneOp() {
    const extraWords = []
    const dd = this.parseDD(extraWords)
    return {
      opEncoding: dd,
      extraWords,
    }

  }

  parseTwoOp1() {
    const extraWords = []
    const op1 = this.parseDD(extraWords)
    this.expect(`comma`, `after first operand`)
    const op2 = this.parseDD(extraWords)

    return {
      opEncoding: op1 << 6 | op2,
      extraWords,
    }
  }

  parseTwoOp2() { // register comes second
    const extraWords = []
    const op1 = this.parseDD(extraWords)
    this.expect(`comma`)
    const reg = this.expect(`register`, ``)

    return {
      opEncoding: Registers[reg.text] << 6 | op1,
      extraWords,
    }
  }

  parseTwoOp3() { // register comes first
    const extraWords = []
    const reg = this.expect(`register`, ``)
    this.expect(`comma`)
    const op1 = this.parseDD(extraWords)

    return {
      opEncoding: Registers[reg.text] << 6 | op1,
      extraWords,
    }
  }

  parseBranch() {
    const target = this.next()
    let offset = this.parseExpression(target)
    if (isNaN(offset)) { // forward reference: replace with . for now
      offset = this.context.clc + 2 
    }

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

  parseSob() {
    const reg = this.expect(`register`)
    this.expect(`comma`)
    const target = this.next()
    let offset = this.parseExpression(target)
    if (offset >= this.context.clc)
      error(target, 
        `the target of a SOB instruction must be at a lower address than the instruction itself`)

    offset = ((this.context.clc + 2) - offset) / 2
    if (offset > 0o77)
      error(target, `is too far away from this instruction (its offset is ${offset} words, ` +
        `and we're limited to an offset of 63 words`)
    return {
      opEncoding: Registers[reg.text] << 6 | offset & 0x3f,
      extraWords: [],
    }
  }

  parseJsr() {
    // const reg: LexToken = this.expect(`register`)
    this.expect(`comma`)
    const extraWords = []
    const target = this.parseDD(extraWords)
    return {
      opEncoding: target,
      extraWords: listForExtras(extraWords[0]),
    }
  }

  parseRts() {
    const reg = this.expect(`register`, `RTS takes a register operand`)
    return {
      opEncoding: Registers[reg.text],
      extraWords: [],
    }
  }

  parseTrap() {
    let value = 0
    let next = this.next()

    if (this.peek().type === `NL`) {
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

  parseOpcode() {
    return {
      opEncoding: 0,
      extraWords: [],
    }
  }

  parseOpcodeLine(sym: LexToken) {
    let opcode = sym.text
    const operator = Operators[opcode]
    let operands: OpAndExtra


    switch (operator.fmt) {
      case `OneOp`:   
        operands = this.parseOneOp()
        break
      case `TwoOp1`: 
        operands = this.parseTwoOp1()
        break
      case `TwoOp2`: 
        operands = this.parseTwoOp2()
        break
      case `TwoOp3`: 
        operands = this.parseTwoOp3()
        break
      case `Branch`: 
        operands = this.parseBranch()
        break
      case `Sob`:       
        operands = this.parseSob()
        break
      case `Jsr`:       
        operands = this.parseJsr()
        break
      case `Rts`:       
        operands = this.parseRts()
        break
      case `Trap`:   
        operands = this.parseTrap()
        break
      case `Opcode`:   
        operands = this.parseOpcode()
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


  generateEMT(func: number): [ number, number ] {
    const instruction = 0o104 | func
    this.context.storeWordInMemory(instruction, MemInstruction)
    return [ func, 0o210 ]
  }

  parseAsciiDirective(sym: LexToken): ICodegenLine {
    let generatedBytes: number[] = []
    const splitter = new RegExp(/^\.(asciiz|asciz|ascii)\b\s*(.+)/)
    const match = splitter.exec(sym.text)
    if (!match) {
      error(sym, "A .asci(i|z) directive needs a delimited string") 
    }

    let [ _line, directive, string ] = match
    string = string.trim()

    if (string.length == 0)
      error(sym, `A .${directive} directive needs a delimited string`) 

    if (string.length == 1)
      error(sym, `A .${directive} directive needs matched string delimiters`) 

    const delimiter = string[0]
    const closeDelimiterPos = string.indexOf(delimiter, 1)
    
    if (closeDelimiterPos < 0)
      error(sym, `The opening delimter (${string[0]}) has no mmatching closing delimiter`)

    const rest = string.slice(closeDelimiterPos+1)

    if (!rest.match(/^\s*(;|$)/))
      error(sym, `Extra stuff ("${rest}") after closing string delimiter`)

    for (let i = 1; i < closeDelimiterPos; i++) {
      const ch = string.charCodeAt(i) 
      this.context.storeByteInMemory(ch, MemData)
      generatedBytes.push(ch)
    }

    if (directive.endsWith(`z`)) {
      this.context.storeByteInMemory(0, MemData)
      generatedBytes.push(0)
    }

    return {
      line: sym.line,
      type: `CodegenLine`,
      rhs: [],
      opcode: directive,
      generatedBytes,
      labels: [],
      address: 0,
      comment: null,
      height_in_lines: 1,
    }
  }


  parseDirectiveLine(sym: LexToken): ICodegenLine {
    let value: number
    let count: number
    let generatedBytes: number[] = []
    const line = sym.line
    const pos = this.lexer.position()

    switch (sym.text) {

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

        // we could just do:
        //
        //    this.context.clc += count
        //
        // but I want to animate storing values, so for now
        // I'll store zeroes
      
        for (let i = 0; i < count; i++) {
          this.context.storeByteInMemory(55, MemData)
          generatedBytes.push(0)
        }

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

      case `.print`:
        generatedBytes = generatedBytes.concat(this.generateEMT(0o351))
        break

      case `.ttyout`:
        generatedBytes = generatedBytes.concat(this.generateEMT(0o341))
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
        error(sym, `Unknown directive`)
    }
    return {
      line,
      type: `CodegenLine`,
      rhs: this.lexer.tokensFromPosition(pos),
      opcode: sym.text,
      generatedBytes,
      labels: [],
      address: 0,
      comment: null,
      height_in_lines: 1,
    }
  }

  parseAssignmentLine(sym: LexToken): { tokens: LexToken[], value: number } {
    this.expect(`equals`, `expecting ':' (if "${sym.text}" is a label); otherwise expecting an opcode`)
    this.skipWS()
    const { tokens, value } = this.collectTokens(() => this.parseExpression(this.next()))
    this.context.addAssigned(sym.text, value)
    return { tokens, value }
  }

  parseLabelledLine(sym: LexToken): ICodegenLine {
    const labels = []
    const line = sym.line

    let returnValue: ICodegenLine = {
      type: `CodegenLine`,
      comment: null,
      line: 0,
      height_in_lines: 1,
      address: 0,
      labels: [],
      opcode: null,
      rhs: [],
      generatedBytes: []
    }


    while (sym && sym.type === `label`) {
      this.context.addLabel(sym.text)
      labels.push(sym.text)
      sym = this.next()
    }

    const address = this.context.clc

    switch (sym.type) {
      case `NL`:
        this.pushBack(sym)
        break 

      case `EOF`:
      case `comment`:
        break

      case `opcode`:
        this.skipWS()
        const opResult = this.collectTokens(() => this.parseOpcodeLine(sym))
      returnValue.opcode = sym.text
      returnValue.rhs = opResult.tokens
      returnValue.generatedBytes = opResult.value
      break

      case `ascii`:
        returnValue = this.parseAsciiDirective(sym)
        break

      case `directive`:
        this.skipWS()
        returnValue = this.parseDirectiveLine(sym)
        break

      default:
        error(sym, `Expecting an opcode or a directive after a label`)
    }

    if (sym.type === `comment`)  {
      returnValue.comment = sym.text
    }

    returnValue.line = line
    returnValue.labels = labels
    returnValue.address = address
    return returnValue
  }
}


