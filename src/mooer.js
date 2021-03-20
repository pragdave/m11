const Moo = require("moo")

const Registers = { 
  r0: 0, r1: 1, r2: 2, r3: 3, r4: 4, r5: 5, r6: 6, r7: 7, sp: 6, pc: 7, 
}

const Operators = {

  // 15			12	11		9	8		6	5		3	2		0
  // Opcode	Src	Register	Dest	Register

  mov:  { fmt: "TwoOp1", op: 0o010000, desc: `Move: Dest ← Src` },
  movb: { fmt: "TwoOp1", op: 0o110000, desc: `Move: Dest ← Src` },
  cmp:  { fmt: "TwoOp1", op: 0o020000, desc: `Compare: Set-flags(Src − Dest)` },
  cmpb: { fmt: "TwoOp1", op: 0o120000, desc: `Compare: Set-flags(Src − Dest)` },
  bit:  { fmt: "TwoOp1", op: 0o030000, desc: `Bit test: Set-flags(Src ∧ Dest)` },
  bitb: { fmt: "TwoOp1", op: 0o130000, desc: `Bit test: Set-flags(Src ∧ Dest)` },
  bic:  { fmt: "TwoOp1", op: 0o040000, desc: `Bit clear: Dest ← Dest ∧ Ones-complement(Src)` },
  bicb: { fmt: "TwoOp1", op: 0o140000, desc: `Bit clear: Dest ← Dest ∧ Ones-complement(Src)` },
  bis:  { fmt: "TwoOp1", op: 0o050000, desc: `Bit set: Dest ← Dest ∨ Src` },
  bisb: { fmt: "TwoOp1", op: 0o150000, desc: `Bit set: Dest ← Dest ∨ Src` },
  add:  { fmt: "TwoOp1", op: 0o060000, desc: `Add: Dest ← Dest + Src` },
  sub:  { fmt: "TwoOp1", op: 0o160000, desc: `Subtract: Dest ← Dest − Src` },


  // 15						9	8		6	5		3	2		0
  // Opcode	Reg	Src/Dest	Register


  mul:  { fmt: `TwoOp2`, op: 0o070000, desc: `Multiply: (Reg, Reg+1) ← Reg × Src` },
  div:  { fmt: `TwoOp2`, op: 0o071000, desc: `Divide: Compute (Reg, Reg+1) ÷ Src; Reg ← quotient; Reg+1 ← remainder` },
  ash:  { fmt: `TwoOp2`, op: 0o072000, desc: `Arithmetic shift: if Src<5:0> < 0 then Reg ← Shift-right(Reg, -Src<5:0>) else Reg ← Shift-left(Reg, Src<5:0>)` },
  ashc: { fmt: `TwoOp2`, op: 0o073000, desc: `Arithmetic shift combined: if Src<5:0> < 0 then (Reg, Reg+1) ← Shift-right((Reg, Reg+1), -Src<5:0>) else (Reg, Reg+1) ← Shift-left((Reg, Reg+1), Src<5:0>)` },
  xor:  { fmt: `TwoOp2`, op: 0o074000, desc: `Exclusive or: Dest ← Dest ⊻ Reg` },

  // 15									6	5		3	2		0
  // Opcode	Src/Dest	Register

  jmp:  { op: 0o000100, fmt: "OneOp", desc: `Jump: PC ← Src` },
  swab: { op: 0o000300, fmt: "OneOp", desc: `Swap bytes of word: Dest ← Swap-bytes(Dest)` },
  clr:  { op: 0o005000, fmt: "OneOp", desc: `Clear: Dest ← 0` },
  clrb: { op: 0o105000, fmt: "OneOp", desc: `Clear: Dest ← 0` },
  com:  { op: 0o005100, fmt: "OneOp", desc: `Complement: Dest ← Ones-complement(Dest)` },
  comb: { op: 0o105100, fmt: "OneOp", desc: `Complement: Dest ← Ones-complement(Dest)` },
  inc:  { op: 0o005200, fmt: "OneOp", desc: `Increment: Dest ← Dest + 1` },
  incb: { op: 0o105200, fmt: "OneOp", desc: `Increment: Dest ← Dest + 1` },
  dec:  { op: 0o005300, fmt: "OneOp", desc: `Decrement: Dest ← Dest − 1` },
  decb: { op: 0o105300, fmt: "OneOp", desc: `Decrement: Dest ← Dest − 1` },
  neg:  { op: 0o005400, fmt: "OneOp", desc: `Negate: Dest ← Twos-complement(Dest)` },
  negb: { op: 0o105400, fmt: "OneOp", desc: `Negate: Dest ← Twos-complement(Dest)` },
  adc:  { op: 0o005500, fmt: "OneOp", desc: `Add carry: Dest ← Dest + C flag` },
  adcb: { op: 0o105500, fmt: "OneOp", desc: `Add carry: Dest ← Dest + C flag` },
  sbc:  { op: 0o005600, fmt: "OneOp", desc: `Subtract carry: Dest ← Dest - C flag` },
  sbcb: { op: 0o105600, fmt: "OneOp", desc: `Subtract carry: Dest ← Dest - C flag` },
  tst:  { op: 0o005700, fmt: "OneOp", desc: `Test: Set-flags(Src)` },
  tstb: { op: 0o105700, fmt: "OneOp", desc: `Test: Set-flags(Src)` },
  ror:  { op: 0o006000, fmt: "OneOp", desc: `Rotate right: Dest ← Rotate-right(Dest, 1)` },
  rorb: { op: 0o106000, fmt: "OneOp", desc: `Rotate right: Dest ← Rotate-right(Dest, 1)` },
  rol:  { op: 0o006100, fmt: "OneOp", desc: `Rotate left: Dest ← Rotate-left(Dest, 1)` },
  rolb: { op: 0o106100, fmt: "OneOp", desc: `Rotate left: Dest ← Rotate-left(Dest, 1)` },
  asr:  { op: 0o006200, fmt: "OneOp", desc: `Arithmetic shift right: Dest ← Shift-right(Dest, 1)` },
  asrb: { op: 0o106200, fmt: "OneOp", desc: `Arithmetic shift right: Dest ← Shift-right(Dest, 1)` },
  asl:  { op: 0o006300, fmt: "OneOp", desc: `Arithmetic shift left: Dest ← Shift-left(Dest, 1)` },
  aslb: { op: 0o106300, fmt: "OneOp", desc: `Arithmetic shift left: Dest ← Shift-left(Dest, 1)` },
  mtps: { op: 0o106400, fmt: "OneOp", desc: `Move to PSW: PSW ← Src` },
  mfpi: { op: 0o006500, fmt: "OneOp", desc: `Move from previous I space: −(SP) ← Src` },
  mfpd: { op: 0o106500, fmt: "OneOp", desc: `Move from previous D space: −(SP) ← Src` },
  mtpi: { op: 0o006600, fmt: "OneOp", desc: `Move to previous I space: Dest ← (SP)+` },
  mtpd: { op: 0o106600, fmt: "OneOp", desc: `Move to previous D space: Dest ← (SP)+` },
  sxt:  { op: 0o006700, fmt: "OneOp", desc: `Sign extend: if N flag ≠ 0 then Dest ← -1 else Dest ← 0` },
  mfps: { op: 0o106700, fmt: "OneOp", desc: `Move from PSW: Dest ← PSW` },



  // 15						9	8	7							0
  // Opcode	C	Offset

  br:   { op: 0o000400, fmt: "Branch", desc: `Branch always PC ← PC + 2 × Sign-extend(Offset)` },
  bne:  { op: 0o001000, fmt: "Branch", desc: `Branch if not equal Z = 0` },
  beq:  { op: 0o001400, fmt: "Branch", desc: `Branch if equal Z = 1` },
  bge:  { op: 0o002000, fmt: "Branch", desc: `Branch if greater than or equal (N ⊻ V) = 0` },
  blt:  { op: 0o002400, fmt: "Branch", desc: `Branch if less than (N ⊻ V) = 1` },
  bgt:  { op: 0o003000, fmt: "Branch", desc: `Branch if greater than (Z ∨ (N ⊻ V)) = 0` },
  ble:  { op: 0o003400, fmt: "Branch", desc: `Branch if less than or equal (Z ∨ (N ⊻ V)) = 1` },
  bpl:  { op: 0o100000, fmt: "Branch", desc: `Branch if plus N = 0` },
  bmi:  { op: 0o100400, fmt: "Branch", desc: `Branch if minus N = 1` },
  bhi:  { op: 0o101000, fmt: "Branch", desc: `Branch if higher (C ∨ Z) = 0` },
  blos: { op: 0o101400, fmt: "Branch", desc: `Branch if lower or same (C ∨ Z) = 1` },
  bvc:  { op: 0o102000, fmt: "Branch", desc: `Branch if overflow clear V = 0` },
  bvs:  { op: 0o102400, fmt: "Branch", desc: `Branch if overflow set V = 1` },
  bcc:  { op: 0o103000, fmt: "Branch", desc: `Branch if carry clear, or Branch if higher or same C = 0` },
  bhis: { op: 0o103000, fmt: "Branch", desc: `Branch if carry clear, or Branch if higher or same C = 0` },
  bcs:  { op: 0o103400, fmt: "Branch", desc: `Branch if carry set, or Branch if lower C = 1` },
  blo:  { op: 0o103400, fmt: "Branch", desc: `Branch if carry set, or Branch if lower C = 1` },


  // 15						9	8		6	5					0
  // Opcode	Reg	Offset
  sob:   { op: 0o077000, fmt: "Sob", desc:	`SOB	Subtract One and Branch: Reg ← Reg - 1; if Reg ≠ 0 then PC ← PC - 2 × Offset` },

  // 15						9	8		6	5		3	2		0
  // Opcode	Reg	Src	Register

  jsr:  { op: 0o004000, fmt: `Jsr`,   desc: `Jump to subroutine: -(SP) ← Reg; Reg ← PC; PC ← Src` },

  // 15												3	2		0
  // Opcode	Reg
  rts:  { op: 0o000200, fmt: `Rts`,   desc: `RTS	Return from subroutine: PC ← Reg; Reg ← (SP)+` },

  // 15						9	8	7							0
  // Opcode	S	Operation Code
  emt:  { op: 0o104000, fmt: `Trap`,  desc: `Emulator trap: -(SP) ← PS; -(SP) ← PC; PC ← (30); PS ← (32)` },
  trap: { op: 0o104400, fmt: `Trap`,  desc: `General trap: -(SP) ← PS; -(SP) ← PC; PC ← (34); PS ← (36)` },

  // 15															0
  // Opcode

  halt:  { op: 0o000000, fmt: `Opcode`, desc: `halt` },
  wait:  { op: 0o000001, fmt: `Opcode`, desc: `wait for interrupt` },
  rti:   { op: 0o000002, fmt: `Opcode`, desc: `Return from interrupt: PC ← (SP)+; PS ← (SP)+` },
  bpt:   { op: 0o000003, fmt: `Opcode`, desc: `Breakpoint trap: -(SP) ← PS; -(SP) ← PC; PC ← (14); PS ← (16)` },
  iot:   { op: 0o000004, fmt: `Opcode`, desc: `I/O trap: -(SP) ← PS; -(SP) ← PC; PC ← (20); PS ← (22)` },
  reset: { op: 0o000005, fmt: `Opcode`, desc: `reset external bus` },

  
  // 15                 6 5 4 3 2 1 0
  // Opcode               1 S N Z V C

  clc: { op: 0o000241, fmt: `Opcode`, desc: `clear C` },
  clv: { op: 0o000242, fmt: `Opcode`, desc: `clear V` },
  clz: { op: 0o000244, fmt: `Opcode`, desc: `clear Z` },
  cln: { op: 0o000250, fmt: `Opcode`, desc: `clear N` },
  sec: { op: 0o000261, fmt: `Opcode`, desc: `setC` },
  sev: { op: 0o000262, fmt: `Opcode`, desc: `set V` },
  sez: { op: 0o000264, fmt: `Opcode`, desc: `set Z` },
  sen: { op: 0o000270, fmt: `Opcode`, desc: `set N` },
  scc: { op: 0o000277, fmt: `Opcode`, desc: `set all CC's` },
  ccc: { op: 0o000257, fmt: `Opcode`, desc: `clear all CC's` },
  nop: { op: 0o000240, fmt: `Opcode`, desc: `no Operation` },

}

const Opcodes = Object.keys(Operators)

function otherError(msg) {
  console.error(msg)
  throw msg
}

function error(sym, msg) {
  console.error(msg)
  console.info(`${sym.line}:${sym.col}  Looking at «${sym.text}» (type ${sym.type})`)
  throw msg
}

function listForExtras(...extras) {
  return extras.reduce((result, next) => {
    if (next !== undefined)
      result.push(next)
    return result
  },
    []
  )
}

class Lexer {

  constructor() {

    const symbol = `[a-z.\$][a-z0-9.\$]*` 

    this.lexer = Moo.compile({
      WS:              /[ \t]+/,
      comment:         /;.*?$/,
      label:           new RegExp(symbol + `:`),
      ones_complement: "^c",
      octal_number:    /[0-7]+|\^o[0-7]+/,
      binary_number:   /\^b[01]+/,
      decimal_number:  /\^d[0-9]+/,
      float_number:    /\^f[0-9]\.[0-9]/,
      bad_number:      /[0-7][89][0-9]*/,
      comma:           ",",
      single_char:     /'./,
      double_char:     /"../,
      immediate:       "#",
      deferred:        "@",
      open_expr_grp:   "<",
      close_expr_grp:  ">",
      autoinc:         ")+",
      autodec:         "-(",
      lparen:  '(',
      rparen:  ')',
      binop:           /[-+*/&!]/,
      '@':     '@',

      symbol:  {
        match: new RegExp(symbol), 
        type: Moo.keywords({ 
          opcode: Opcodes,
          register: Object.keys(Registers),
        }),
      },
      NL :     { match: /\n/, lineBreaks: true },
    })
    this.tokens = []
  }

  analyze(text) {
    this.lexer.reset(text)
    this.tokens = Array.from(this.lexer)
    this.offset = 0
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
      type: 'EOF',
    }
  }

  peekNotWS() {
    let sym = this.peek()
    while (sym && (sym.type == 'WS' || sym.type == 'comment')) {
      this.offset++
      sym = this.peek()
      if (sym && sym.type == 'NL')
        sym = null
    }
    return sym
  }

  nextNotWS(lexer) {
    let sym = this.peekNotWS()
    if (sym)
      this.offset++

    return sym
  }

  pushBack(sym) {
    this.offset--
    if (this.tokens[this.offset] != sym)
      throw new Error('pushback error')
  }
}


const MemInstruction = 1
const MemOperand     = 2

function octal(n) {
  return (n & 0xffff).toString(8).padStart(6, '0')
}

class Memory {
  constructor() {
    this.memory = []
  }
  getByte(addr) {
    return this.memory[addr]
  }
  setByte(addr, value) {
    this.memory[addr] = value
  }

  getWord(addr) {
    return (this.memory[addr+1] << 8 + this.memory[addr])
  }

  setWord(addr, value) {
    this.memory[addr] = value & 0xff
    this.memory[addr+1] = value >> 8
  }

  toString() {
    const result = []
    for (let i = 0; i < this.memory.length; i += 2) {
      if (this.memory[i] !== undefined || this.memory[i+1] !== undefined) {
        result.push(`${octal(i)}: ${octal(this.memory[i+1] << 8 | this.memory[i])}`)
      }
    }
    return result.join("\n")
  }
}

const SymbolType = {
  undefined: 0,
  label: 1,
  assigned: 2,
}

class Symbol {

  constructor(name, value, type) {
    this.name = name
    this.value = value
    this.type = type
  }

  isDefined() {
    return this.type !== SymbolType.undefined
  }
}

class SymbolTable {
  constructor() {
    this.symbols = {}
  }

  lookup(name) {
    return this.symbols[name]
  }

  getValueOf(name) {
    const sym = this.lookup(name)
    if (sym)
      return sym.value
    else
      return undefined
  }

  setValueOf(name, value) {
    const sym = this.lookup(name)
    if (sym)
      sym.value = value
    else
      otherError(`attempt to update nonexistent symbol "${name}"`)
  }

  addLabel(name, value) {
    if (name in this.symbols) {
      otherError(`Duplicate label "${name}" not allowed`)
    }
    else {
      this.symbols[name] = new Symbol(name, value, SymbolType.label)
    }
  }
}


class ParseContext {

  constructor() {
    this.generated = {}
    this.memory = new Memory
    this.symbols = new SymbolTable()
    this.symbols.addLabel(`.`, 0o1000)
  }

  get clc() { return this.symbols.getValueOf(".") }
  set clc(val) { this.symbols.setValueOf(".", val) }


  addLabel(symbol) {
    if (symbol.endsWith(":"))
      symbol = symbol.slice(0, -1)

    if (symbol in this.symbols) {
      otherError(`Duplicate label "${symbol}" not allowed`)
    }
    else {
      this.symbols.addLabel(symbol, this.clc)
    }
  }


  lookupSymbol(name) {
    return this.symbols.lookup(name)
  }

  addInstruction(instruction, additionalWords) {
    this.storeWordInMemory(instruction, MemInstruction)
    if (additionalWords) {
      additionalWords.forEach(word => {
        this.storeWordInMemory(word, MemOperand)
      })
    }
  }

  storeWordInMemory(value, type) {
    if ((this.clc & 1) === 0) {
      this.memory.setWord(this.clc, value)
      this.clc += 2
    }
    else
      otherError(`Attempt to store a word at an odd address (0x$(this.clc.toString(8)})`)
  }
}


class Parser {
  constructor() {
    this.context = new ParseContext()
    this.lexer = new Lexer()
  }

  //
  // Lexer interface
  //

  lookingAt(symType) {
    const sym = this.lexer.peekNotWS()
    return (sym.type == symType)
  }

  accept(symType) {
    if (this.lookingAt(symType))
      return this.lexer.next()
    else
      return null
  }

  expect(symType, context) {
    const sym = this.lexer.nextNotWS()
    if (sym.type == symType)
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

  //
  // Parsing

  parseLine(line) {
    this.lexer.analyze(line)
    let sym = this.next()

    if (!sym)
      return

    switch (sym.type) {
      case 'comment':
      case 'NL':
        break

      case 'label':
      case 'opcode':
        this.parseLabelledLine(sym)
        break

      default:
        error(sym, `A line should start with a label, an opcode, a directive, or a symbol.`)
        break
    }
  }

  parseExpression(next) {
    let value = this.parseTerm(next)
    let op

    while (op = this.accept('binop')) {
      const t = this.parseTerm(this.next())
      switch (op.text) {
        case '+':
          value += t
          break
        case '-':
          value -= t
          break
        case '*':
          value *= t
          break
        case '/':
          if (t === 0)
            otherError(`attempt to divide ${value} by zero`)
          value /= t 
          break
        case '&':
          value &= t 
          break
        case '!':
          value |= t 
          break
        default:
          error(op, `invalid binarey operartor`)
      }
    }
    return value & 0xffff
  }

  parseIntLiteral(number, base) {
    if (number.startsWith('^'))
      number = number.slice(2)
    return Number.parseInt(number, base)
  }

  parseTerm(next) {
    let sign = 1
    let value
    let complement = false

    while (next.type == "binop" && (next.text == "+" || next.text == "-")) {
      if (next.text == "-")
        sign = -sign
      next = this.next()
    }

    if (next.type == 'ones_complement') {
      complement = true
      next = this.next()
    }

    switch (next.type) {
      case 'octal_number':
        value = this.parseIntLiteral(next.text, 8)
        break

      case 'decimal_number':
        value = this.parseIntLiteral(next.text, 10)
        break

      case 'binary_number':
        value = this.parseIntLiteral(next.text, 2)
        break

      case 'bad_number':
        otherError(`If you want "${next.text}" to be a decimal number, precede it with "^d"`)
        break

      case 'open_expr_grp':
        value = this.parseExpression(this.next())
        this.expect(`close_expr_grp`, `missing ">" at end of bracketed expression`)
        break

      case 'symbol':
        const sym = this.lookupSymbol(next.text)
        if (sym && sym.isDefined())
          value = sym.value
        else
          value = NaN
        break

      case 'single_char':
        value = next.text.charCodeAt(1)
        if (value > 127)
          error(next, `Sorry, only 8 bit characters are allowed`)
        break

      case 'double_char':
        const c1 = next.text.charCodeAt(1)
        const c2 = next.text.charCodeAt(1)
        if (c1 > 127 || c2 > 127)
          error(next, `Sorry, only 8 bit characters are allowed`)
        value = c2 << 8 | c1
        break

      default:
        error(next, `invalid start of an expression`)
        break;

    }

    value *= sign
    if (complement)
      value = ~value
    return value

    //     'a
    //     "aa
    //     "<" expression ">"
  }

  parseDD(operator) {
    let next = this.next()
    let mode
    let register
    let extraWord
    let deferred = 0
    let value

    if (next.type === `deferred`) {
      deferred = 1
      next = this.next()
    }

    switch (next.type) {

      case 'register':
        mode = 0
        register = Registers[next.text]
        break

      case 'lparen':
        next = this.expect('register', 'after an "("')
        register = Registers[next.text]

        if (this.lookingAt('autoinc')) {
          mode = 2
        }
        else {
          this.expect('rparen', 'after the register name') 
          mode = 1
        }
        break;

      case 'autodec':
        next = this.expect('register', 'in autodecrement')
        this.expect('rparen', '')
        register = Registers[next.text]
        mode = 4
        break

      case 'immediate':
        value = this.parseExpression(this.next())
        extraWord = value
        register = 7
        mode = 2
        break

      default:
        value = this.parseExpression(next)
        if (this.accept('lparen')) {   // exp(Rn)
          next = this.expect('register', 'inside parentheses of relative address')
          this.expect('rparen', 'after register name')
          extraWord = value
          register = Registers[next.text]
          mode = 6
        }
        else {                      // exp -- relative mode
          extraWord = value - this.context.clc - 4
          register = 7
          mode = 6
        }

    }

    return {
      dd: (mode | deferred) << 3 | register,
      extraWord,
    }
  }

  parseOneOp(operator) {
    const { dd, extraWord } =  this.parseDD(operator)
    return {
      opEncoding: dd,
      extraWords: listForExtras(extraWord),
    }

  }

  parseTwoOp1(operator) {
    const op1 = this.parseDD(operator)
    this.expect('comma', 'after first operand')
    const op2 = this.parseDD(operator)

    return {
      opEncoding: op1.dd << 6 | op2.dd,
      extraWords: listForExtras(op1.extraWord, op2.extraWord),
    }
  }

  parseTwoOp2(operator) {
    const reg = this.expect('register', ``)
    this.expect('comma')
    const op2 = this.parseDD(operator)

    return {
      opEncoding: Registers[reg.text] << 6 | op2.dd,
      extraWords: listForExtras(op2.extraWord),
    }
  }

  parseBranch(operator) {
    const target = this.next()
    let offset = this.parseExpression(target)
    offset -= (this.context.clc + 2)
    offset /= 2
    if (offset < -128 || offset > 127)
      error(target, `is too far away from this instruction (its offset is ${offset} words, ` +
                    `and we're limited to an offset between -128 and +127 words`)
    return {
      opEncoding: offset & 0xff,
      extraWords: []
    }
  }

  parseSob(operator) {
    const reg = this.expect('register')
    this.expect('comma')
    const target = this.next()
    let offset = this.parseExpression(target)
    offset -= (this.context.clc + 2)
    offset /= 2
    if (offset < -128 || offset > 127)
      error(target, `is too far away from this instruction (its offset is ${offset} words, ` +
                    `and we're limited to an offset between -128 and +127 words`)
    return {
      opEncoding: Registers[reg.text] << 8 | offset & 0xff,
      extraWords: []
    }
  }

  parseJsr(operator) {
    const reg = this.expect('register')
    this.expect('comma')
    const target = this.parseDD(operator)
    return {
      opEncoding: Registers[reg.text] << 5 | target.dd,
      extraWords: listForExtras(target.extraWord),
    }
  }

  parseRts(operator) {
    const reg = this.expect('register', 'RTS takes a register operand')
    return {
      opEncoding: Registers[reg.text],
      extraWords: [],
    }
  }

  parseTrap(operator) {
    let value = 0
    let next = this.next()
  
    if (this.peek() === 'NL') {
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
        console.log("OPER", operands)
        break
      default:
        throw new Error(`Unknown operand format: ${operator.fmt}`)
    }
    
    const next = this.next()
    if (next && (next.type != 'NL' && next.type != 'EOF'))  {
      console.dir(next)
      error(next, `extra operands for "${opcode}"`)
    }

    const instruction = operator.op | operands.opEncoding
    this.context.addInstruction(instruction, operands.extraWords)
  }


  parseLabelledLine(sym) {
    while (sym && sym.type == `label`) {
      this.context.addLabel(sym.text)
      sym = this.lexer.nextNotWS()
    }

    if (sym) {
      switch (sym.type) {
        case `opcode`:
          this.parseOpcodeLine(sym)
          break

        default:
          error(sym, `Expecting an opcode or a directive after a label`)
          break
      }
    }
  }


}


const parser = new Parser()
const code = process.argv.slice(2)
code.forEach(line => parser.parseLine(line))
console.log("\nSymbols")
console.log(parser.context.symbols)
console.log("\nMemory")
console.log(parser.context.memory.toString())
