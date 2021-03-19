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
  emt:  { op: 0o104000, fmt: `Trap1`, desc: `Emulator trap: -(SP) ← PS; -(SP) ← PC; PC ← (30); PS ← (32)` },
  trap: { op: 0o104400, fmt: `Trap1`, desc: `General trap: -(SP) ← PS; -(SP) ← PC; PC ← (34); PS ← (36)` },

  // 15															0
  // Opcode

  rti:  { op: 0o000002, fmt: `Trap2`, desc: `Return from interrupt: PC ← (SP)+; PS ← (SP)+` },
  bpt:  { op: 0o000003, fmt: `Trap2`, desc: `Breakpoint trap: -(SP) ← PS; -(SP) ← PC; PC ← (14); PS ← (16)` },
  iot:  { op: 0o000004, fmt: `Trap2`, desc: `I/O trap: -(SP) ← PS; -(SP) ← PC; PC ← (20); PS ← (22)` },
  rtt:  { op: 0o000006, fmt: `Trap2`, desc: `Return from trap: PC ← (SP)+; PS ← (SP)+` },
}

const Opcodes = Object.keys(Operators)

function otherError(msg) {
  console.error(msg)
}

function error(sym, msg) {
  otherError(msg)
  console.info(`${sym.line}:${sym.col}  Looking at «${sym.text}» (type ${sym.type})`)
}


class Lexer {

  constructor() {

    const symbol = `[a-z.\$][a-z0-9.\$]*` 

    this.lexer = Moo.compile({
      WS:             /[ \t]+/,
      comment:        /;.*?$/,
      label:          new RegExp(symbol + `:`),
      ones_complement:   /\^c/,
      octal_number:   /[0-7]+|\^o[0-7]+/,
      binary_number:  /\^b[01]+/,
      decimal_number: /\^d[0-9]+/,
      float_number:   /\^f[0-9]\.[0-9]/,
      bad_number:     /[0-7][89][0-9]*/,
      string:         /"(?:\\["\\]|[^\n"\\])*"/,
      lparen:  '(',
      rparen:  ')',
      '+':     '+',
      '-':     '-',
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

class ParseContext {

  constructor() {
    this.generated = {}
    this.codeMemory = []
    this.symbols = {
      ".": 0o1000
    }
  }

  get clc() { return this.symbols["."] }
  set clc(val) { this.symbols["."] = val }


  addLabel(symbol) {
    if (symbol in this.symbols) {
      otherError(`Duplicate label "${symbol}" not allowed`)
    }
    else {
      this.symbols[symbol] = this.clc
    }
  }

  addInstruction(instruction, additionalWords) {
    this.storeWordInMemory(instruction, MemInstruction)
    if (additionalWords) {
      console.log("AW", additionalWords)
      additionalWords.forEach(word => {
        this.storeWordInMemory(word, MemOperand)
      })
    }
  }

  storeWordInMemory(value, type) {
    if ((this.clc & 1) === 0) {
      this.codeMemory[this.clc++] = value & 0xff
      this.codeMemory[this.clc++] = (value >> 8) & 0xff
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

  parseLine(line) {
    this.lexer.analyze(line)
    let sym = this.lexer.nextNotWS()

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

  pushBack(sym) {
    this.lexer.pushBack(sym)
  }

  parseExpression(next) {
    return this.parseTerm(next)
    // while op
    //   term
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

    while (next.type == "-" || next.type == "+") {
      console.log("prefix", next.type)
      if (next.type == "-")
        sign = -sign
      next = this.lexer.next()
    }

    console.log("term", next)
    if (next.type == 'ones_complement') {
      complement = true
      next = this.lexer.nextNotWS()
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

      default:
        error(next, `invalid start of an expression`)
        break;

    }
    
    value *= sign
    if (complement)
      value = ~value
    return value

// V    number
//     symbol
//     'a
//     "aa
//     "<" expression ">"
  }

  parseDDDDDD(operator) {
    let next = this.lexer.nextNotWS()
    let mode
    let register
    let extraWord


    switch (next.type) {

      case 'register':
        mode = 0
        register = Registers[next.text]
        break

      case 'lparen':
        next = this.lexer.nextNotWS()
        if (next.type == 'register') {
          this.expect(`rparen`, `after register`)
          const aa = this.lexer.peekNotWS()
          if (aa.type == '+') {       // (rn)+
            mode = 2
            register = Registers[next.text]
          }
          else if (aa.type == 'EOF') {  // (rn)
            mode = 1
            register = Registers[next.text]
          }
          else 
            error(`unknown address style: "(${register.text})${aa.text}"`)
          break
        }
        error(`unknown address style: "(${register.text})${aa.text}"`)

      case '-':
        if (this.lookingAt('(')) {  // -(rn)
          break
        }
        
        // fall through...
        //
      default:
        console.log('default', next)
        const value = this.parseExpression(next)

        if (this.accept('(')) {   // exp(Rn)
          next = this.expect('register', 'inside parentheses of relative address')
          this.expect(')', 'after register name')
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
      dddddd: mode << 3 | register,
      extraWord,
    }
  }

  parseOneOp(operator) {
    const { dddddd, extraWord } =  this.parseDDDDDD(operator)
    return {
      opEncoding: dddddd,
      extraWords: extraWord === undefined ? [] : [ extraWord ]
    }
      
  }

  parseTwoOp1(operator) {
  }

  parseTwoOp2(operator) {
  }

  parseBranch(operator) {
  }

  parseSob(operator) {
  }

  parseJsr(operator) {
  }

  parseRts(operator) {
    const reg = this.expect('register', 'RTS takes a register operand')
    return {
      opEncoding: Registers[reg.text],
      extraWords: [],
    }
  }

  parseTrap1(operator) {
  }

  parseTrap2(operator) {
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
    case `Trap1`:   
      operands = this.parseTrap1(operator)
      break
    case `Trap2`:   
      operands = this.parseTrap2(operator)
      break
    }
    const instruction = operator.op | operands.opEncoding
    console.log(`0o` + (instruction).toString(8))
    console.log(operands)
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
parser.parseLine(process.argv[2])
console.log(parser.context)
