import { decodeTable, EmulatorDecoders } from "./instruction_decode"
import { octal, saddw } from "../helpers"
import { AdditionalStatus, Auditor } from "./auditor"
import { internallyHandledEMT } from "./extensions"
import { MachineState, MSMemory, MSRegisters, PS } from "./machine_state"

const SP = 6, PC = 7

const BIT15     = 0o100000
const WORD_MASK = 0o177777

const BIT7      = 0o000200
const BYTE_MASK = 0o000377

// const Mask = [ 0, BYTE_MASK, WORD_MASK ]  // indexed by byte count

interface Accessor {
 addr: number
 getWord: () => number,
 setWord: (val: number) => void,
 getByte: () => number,
 setByte: (val: number) => void,
}

function additiveOverflow(src: number, dst: number, result: number) {
  return ((src & BIT15) === (dst & BIT15)) &&   // different sign
    ((dst & BIT15) !== (result & BIT15)) // dst same as result
}

function subtractiveOverflow(minuend: number, subtrahend: number, result: number, msb = BIT15) {
  return ((minuend & msb) ^ (subtrahend & msb)) &&   // different sign
    ((subtrahend & msb) === (result & msb)) // subtrahend same as result
}


export class Emulator implements EmulatorDecoders {

  machineState: MachineState
  registers: MSRegisters
  memory: MSMemory
  auditor: Auditor

  priorPC = 0

  constructor(machineState: MachineState) {
    this.machineState = machineState
    this.registers    = machineState.registers
    this.memory       = machineState.memory
    this.auditor      = new Auditor(this.memory, this.registers, this.machineState.processorState)
  }

  getEmulationState(callback = null) {
    let additionalStatus: AdditionalStatus

    this.auditor.enable()

    if (callback) {
      try {
        callback()
      }
      catch (e)  {
        additionalStatus = {
          message: e.message,
          pc:      this.priorPC,
        }
      }
    }

    return this
    .auditor
    .reportAndDisable(additionalStatus, this.machineState.processorState)
  }

  step() {
    this.machineState.processorState = PS.Running

    return this.getEmulationState(() => {
      this.priorPC = this.registers[PC]
      this.decodeAndRun(this.fetchAtPC())
      switch (this.machineState.processorState) {
        case PS.Paused:
          console.error(`Ignoring unlikely paused state`)
          break
        case PS.Running:
          this.machineState.processorState = PS.Paused
          break
        default:
          // let playgraound handle it
          break
      }
    })
  }

  fetchAtPC() {
    const pc = this.registers[PC]
    const word = this.memory.getWord(pc)
    this.registers[PC] = pc + 2
    return word
  }

  decodeAndRun(instruction: number) {
    for (let desc of decodeTable) {
      const decoder = desc.decode
      const opcode = instruction & desc.mask
      if (opcode || desc.mask === 0o177777) {
        const handler = desc.opcodes[opcode]
        if (handler) {
          // TODO: remove next 3 after all tests finished
          if (!decoder || !(decoder in this)) {
            throw new Error(`can't decode ${desc.decode}`) 
          }
          return this[decoder](handler, instruction)
        }
      }
    }

    throw new Error(`Invalid instruction: "${octal(instruction)}"`)
  }


  decode_single(handler: string, instruction: number) {
    const bytes = (instruction & 0x8000) ? 1 : 2
    const op = this.getOperandAccessor(instruction, bytes)
    this[handler](instruction, op)
  }

  decode_one_and_a_half(handler: string, instruction: number) {
    const op = this.getOperandAccessor(instruction, 2)
    const rno = (instruction >> 6) & 7
    let reg = this.registers[rno]
    this[handler](instruction, op, rno, reg)
  }

  decode_double(handler: string, instruction: number) {
    const bytes = (instruction & 0x8000) ? 1 : 2
    const op1 = this.getOperandAccessor(instruction >> 6, bytes)
    const op2 = this.getOperandAccessor(instruction, bytes)
    this[handler](instruction, op1, op2)
  }

  decode_branch(handler: string, instruction: number) {
    let offset = instruction & 0xff
    if (offset & 0x80) 
      offset -= 256

    const newPC = this.registers[PC] + 2 * offset

    this[handler](instruction, newPC)
  }

  decode_jsr(handler: string, instruction: number) {
    this.decode_one_and_a_half(handler, instruction)
  }

  decode_sob(handler: string, instruction: number) {
    const offset = instruction  & 0o77
    const rno = (instruction >> 6) & 7
    let reg = this.registers[rno]
    this[handler](instruction, rno, reg, offset)
  }

  decode_rts(handler: string, instruction: number) {
    const rno = instruction  & 7
    let reg = this.registers[rno]
    this[handler](instruction, rno, reg)
  }

  decode_trap(handler: string, instruction: number) {
    const func = instruction & 0xff
    this[handler](instruction, func)
  }

  decode_cc(handler: string, instruction: number) {
    this[handler](instruction)
    return handler // just until all opcodes implemented
  }

  decode_none(handler: string, instruction: number) {
    this[handler](instruction)
    return handler // just until all opcodes implemented
  }


  getRegisterAccessor(rno: number): Accessor {
    return {
      addr: rno,
      getWord: () => {
        const value = this.registers[rno]
          return value
      },
      setWord: (val: number) =>  {
        this.registers[rno] = val & WORD_MASK
      },
      getByte: () => this.registers[rno] & 0xff,
      setByte: (val: number) => {
        this.registers[rno] = (this.registers[rno] & 0xff00) | (val & 0xff)
      },
    }
  }

  getMemoryAccessor(addr: number): Accessor {
    return {
      addr,
      getWord: ()    => {
        const value = this.memory.getWord(addr)
        console.log("getWord", addr, "is", value)
        return value
      },
      setWord: (val: number) => {
        this.memory.setWord(addr, val)
      },
      getByte: ()    => this.memory.getByte(addr),
      setByte: (val: number) => this.memory.setByte(addr, val & BYTE_MASK),
    }
  }


  getOperandAccessor(dd: number, bytes: number /* 1 or 2 */): Accessor {
    dd &= 0o77
    const mode = dd >> 3
    const rno  = dd & 7
    let reg    = this.registers[rno]
    let result: number
    let addr: number
    let offset: number

    switch (mode) {
      case 0:   // Rn
        return this.getRegisterAccessor(rno)

      case 1:   // (Rn)
        return this.getMemoryAccessor(reg)

      case 2:   // (Rn)+
        result = reg        
        this.registers[rno] = reg + (rno == 7 ? 2 : bytes)
        return this.getMemoryAccessor(result)

      case 3:   // @(Rn)+
        result = this.memory.getWord(reg)
        this.registers[rno] = reg + (rno == 7 ? 2 : bytes)
        return this.getMemoryAccessor(result)

      case 4:  // -(Rn)
        result = reg - bytes
        this.registers[rno] = result
        return this.getMemoryAccessor(result)

      case 5:  // @-(Rn)
        reg -= 2
        result = this.memory.getWord(reg)
        this.registers[rno] = reg
        return this.getMemoryAccessor(result)

      case 6: // myLabel  (PC relative or XX(rn))
        offset = this.fetchAtPC()
        reg = this.registers[rno]
        result = saddw(offset, reg)
        return this.getMemoryAccessor(result)

      case 7: // @X(Rn)
        offset = this.fetchAtPC()
        reg = this.registers[rno]
        addr = saddw(offset, reg)
        result = this.memory.getWord(addr)
        return this.getMemoryAccessor(result)
    }
  }



  ////////////////////////////////////////////////////////////////////////////////
  //
  // The instructions, ordered by operand field length 
  //
  ////////////////////////////////////////////////////////////////////////////////

    mov(_inst: number, op1: Accessor, op2: Accessor)     {
      const value = op1.getWord()
      op2.setWord(value)
      this.memory.psw.Z = value === 0
      this.memory.psw.N = !!(value & BIT15)
      this.memory.psw.V = false
    }

  movb(inst: number, op1: Accessor, op2: Accessor)    { 
    let value = op1.getByte()
    const dest = inst & 0o000377

    // mode zero (register target) sign extends...
    if (dest & 0o70) {
      op2.setByte(value)
    }
    else {
      if (value & 0x80)
        value |= 0xff00
      op2.setWord(value)
    }

    this.memory.psw.Z = value === 0
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.V = false
  }

  cmp(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const result = src + ~dst + 1
    psw.N = !!(result & BIT15)
    psw.Z = (result & WORD_MASK) === 0
    this.memory.psw.V = subtractiveOverflow(src, dst, result)
    this.memory.psw.C = !!(result & ~WORD_MASK)
  }

  cmpb(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getByte()
    const dst = op2.getByte()
    const result = src + ~dst + 1
    psw.N = !!(result & BIT7)
    psw.Z = (result & BYTE_MASK) === 0
    this.memory.psw.V = subtractiveOverflow(src, dst, result, BIT7)
    this.memory.psw.C = !!(result & ~BYTE_MASK)
  }

  bit(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const value = src & dst
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected 
  }

  bitb(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getByte()
    const dst = op2.getByte()
    const value = src & dst
    psw.N = !!(value & BIT7)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bic(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const value = (~src) & dst
    op2.setWord(value)
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bicb(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getByte()
    const dst = op2.getByte()
    const value = (~src) & dst
    op2.setByte(value)
    psw.N = !!(value & BIT7)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bis(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const value = src | dst
    op2.setWord(value)
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bisb(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getByte()
    const dst = op2.getByte()
    const value = src | dst
    op2.setByte(value)
    psw.N = !!(value & BIT7)
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  add(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const result = src + dst

    psw.Z = (result & WORD_MASK) === 0
    psw.N = !!(result & BIT15) 
    psw.V = additiveOverflow(src, dst, result)
    psw.C = !!(result & ~WORD_MASK)

    op2.setWord(result & WORD_MASK)
  }

  sub(_inst: number, op1: Accessor, op2: Accessor)     { 
    const psw = this.memory.psw
    const src = op1.getWord()
    const dst = op2.getWord()
    const result = dst - src

    psw.Z = (result & WORD_MASK) === 0
    psw.N = !!(result & BIT15) 
    psw.V = subtractiveOverflow(dst, src, result)
    psw.C = !!(result & ~WORD_MASK)
    op2.setWord(result & WORD_MASK)
  }

  mul(_inst: number, op1: Accessor, rno: number, reg: number)     { 
    const psw = this.memory.psw
    let src = op1.getWord()

    // convert emulator -ve to actual -ve
    if (reg & BIT15) 
      reg = reg - 65536
    if (src & BIT15)
      src = src - 65536

    const result = reg * src

    if (rno & 1) {
      this.registers[rno] = result & 0xffff
    }
    else {
      this.registers[rno] = (result >> 16) & 0xffff
      this.registers[rno + 1] = result & 0xffff
    }

    psw.N = result < 0 
    psw.Z = result === 0
    psw.V = false
    psw.C = (result < -32768) || (result > 32767)
  }

  div(_inst: number, op1: Accessor, rno: number, reg: number)     { 
    const psw = this.memory.psw
    let src = op1.getWord()
    if (rno & 1) 
      throw new Error(`Register for DIV instruction must be even (got R${rno}})`)

    if (reg & BIT15)
      reg -= 65536

    const dividend = (reg << 16) | this.registers[rno + 1]

    if (src & BIT15)
      src -= 65536

    if (src === 0) {
      psw.C = true
      psw.V = true
    }
    else {
      // don't know if I need to force integer cooercion
      const quotient = Math.floor(dividend / src) >> 0  
      const remainder = dividend % src

      if (Math.abs(quotient) > 32767) {
        psw.V = true
      }

      this.registers[rno] = quotient & 0xffff
      this.registers[rno + 1] = remainder

      psw.N = quotient < 0
      psw.Z = quotient === 0
    }

  }

  ash(_inst: number, _op1: Accessor)     { console.error(`missing ash`) }
  ashc(_inst: number, _op1: Accessor)    { console.error(`missing ashc`) }

  xor(_inst:number, op1: Accessor, _rno: number, reg: number) {
    const psw = this.memory.psw
    const dst = op1.getWord()
    const result = reg ^ dst
    op1.setWord(result)

    psw.N = !!(result & BIT15)
    psw.Z = result === 0
    psw.V = false
    // psw.C unchanged

  }


  sob(_inst: number, rno: number, reg: number, offset: number) { 
    reg -= 1 
    this.registers[rno] = reg & 0xffff
    if (reg !== 0) {
      this.registers[PC] -= 2 * offset
    }
  }

  jmp(_inst: number, op1: Accessor) {
    const target = op1.addr
    debugger
    this.registers[PC] = target
  }

  swab(_inst: number, op1: Accessor)     { 
    let psw = this.memory.psw
    let value = op1.getWord()

    let lob = value & 0xff
    value = (value >> 8) | (lob << 8)

    op1.setWord(value)

    lob = value & 0xff
    psw.N = !!(lob & BIT7)
    psw.Z = lob === 0 
    psw.V = false
    psw.C = false
  }


  clr(_inst: number, op1: Accessor) {
    op1.setWord(0)
    this.memory.psw.Z = true
    this.memory.psw.N = false
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  clrb(_inst: number, op1: Accessor) {
    op1.setByte(0)
    this.memory.psw.Z = true
    this.memory.psw.N = false
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  com(_inst: number, op1: Accessor) {
    const value = ~op1.getWord() & WORD_MASK
    op1.setWord(value)
    this.memory.psw.Z = value === 0
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.V = false
    this.memory.psw.C = true
  }

  comb(_inst: number, op1: Accessor) {
    const value = ~op1.getByte() & BYTE_MASK
    op1.setByte(value)
    this.memory.psw.Z = value === 0
    this.memory.psw.N = !!(value & BIT7)
    this.memory.psw.V = false
    this.memory.psw.C = true
  }


  inc(_inst: number, op1: Accessor)     {
    let value = op1.getWord()
    this.memory.psw.V = value === 0o077777

    value += 1
    op1.setWord(value)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = !!(value & BIT15)
  }

  incb(_inst: number, op1: Accessor)     {
    let value = op1.getByte()
    this.memory.psw.V = value === 0o000177
    value += 1
    op1.setByte(value)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = !!(value & BIT7)
  }

  dec(_inst: number, op1: Accessor)     { 
    let value = op1.getWord()
    this.memory.psw.V = value === 0o100000

    value -= 1
    op1.setWord(value)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = !!(value & BIT15)
  }

  decb(_inst: number, op1: Accessor)     { 
    let value = op1.getByte()
    this.memory.psw.V = value === 0o000200

    value -= 1
    op1.setByte(value)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = !!(value & BIT7)
  }

  neg(_inst: number, op1: Accessor)     { 
    let value = op1.getWord()
    this.memory.psw.V = value === 0o100000

    value = (-value)  & WORD_MASK

    op1.setWord(value)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.C = !this.memory.psw.Z
  }

  negb(_inst: number, op1: Accessor)     { 
    let value = op1.getByte()
    this.memory.psw.V = value === 0o200

    value = (-value)  & BYTE_MASK

    op1.setByte(value)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = !!(value & BIT7)
    this.memory.psw.C = !this.memory.psw.Z
  }

  adc(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw
    let value = op1.getWord()
    if (psw.C) {
      psw.V = value === 0o077777
      psw.C = value === 0o177777 
      value = (value + 1) & WORD_MASK
      op1.setWord(value)
    }
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
  }

  adcb(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw
    let value = op1.getByte()
    if (psw.C) {
      psw.V = value === 0o077777
      psw.C = value === 0o177777 
      value = (value + 1) & WORD_MASK
      op1.setByte(value)
    }
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
  }

  sbc(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw
    let value = op1.getWord()
    if (psw.C) {
      psw.V = value === 0o100000
      psw.C = value !== 0
      value = (value - 1) & WORD_MASK
      op1.setWord(value)
    }
    psw.N = !!(value & BIT15)
    psw.Z = value === 0
  }

  sbcb(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw
    let value = op1.getByte()
    if (psw.C) {
      psw.V = value === 0o000200
      psw.C = value !== 0o000000
      value = (value - 1) & BYTE_MASK
      op1.setByte(value)
    }
    psw.N = !!(value & BIT7) 
    psw.Z = value === 0
  }

  tst(_inst: number, op1: Accessor)     {
    let value = op1.getWord()
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  tstb(_inst: number, op1: Accessor)     {
    let value = op1.getByte()
    this.memory.psw.N = !!(value & BIT7)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  ror(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw

    let value = op1.getWord()
    const cbit = value & 1
    value >>= 1

    if (psw.C) {
      value = value | BIT15
      psw.N = true
    }
    else
      psw.N = false

    psw.C = !!cbit
    psw.Z = value === 0
    psw.V = psw.N !== psw.C

    op1.setWord(value)
  }

  rorb(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw

    let value = op1.getByte() 
    const cbit = value & 1
    value >>= 1

    if (psw.C) {
      value = value | BIT7
      psw.N = true
    }
    else
      psw.N = false

    psw.C = !!cbit
    psw.Z = value === 0
    psw.V = psw.N !== psw.C

    op1.setByte(value)
  }

  rol(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw

    let value = op1.getWord() 
    const cbit = value & BIT15
    value = (value << 1) & WORD_MASK

    if (psw.C) {
      value = value | 1
    }

    psw.N = !!(value & BIT15)
    psw.C = !!cbit
    psw.Z = value === 0
    psw.V = psw.N !== psw.C

    op1.setWord(value)
  }

  rolb(_inst: number, op1: Accessor)     { 
    const psw = this.memory.psw

    let value = op1.getByte() 
    const cbit = value & BIT7
    value = (value << 1) & BYTE_MASK

    if (psw.C) {
      value = value | 1
    }

    psw.N = !!(value & BIT7)
    psw.C = !!cbit
    psw.Z = value === 0
    psw.V = psw.N !== psw.C

    op1.setByte(value)
  }


  asr(_inst: number, op1: Accessor)     { 
    let value = op1.getWord() 
    this.memory.psw.C = (value & 1) === 1

    if (value & BIT15) {
      value = value >> 1
      value = value | BIT15
      this.memory.psw.N = true
    }
    else {
      value = value >> 1
      this.memory.psw.N = false
    }

    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N !== this.memory.psw.C

    op1.setWord(value)
  }

  asrb(_inst: number, op1: Accessor)     { 
    let value = op1.getByte() 
    this.memory.psw.C = (value & 1) === 1

    if (value & BIT7) {
      value = value >> 1
      value = value | BIT7
      this.memory.psw.N = true
    }
    else {
      value = value >> 1
      this.memory.psw.N = false
    }

    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N !== this.memory.psw.C

    op1.setByte(value)
  }


  asl(_inst: number, op1: Accessor)     { 
    let value = op1.getWord() 
    this.memory.psw.C = (value & BIT15) !== 0

    value = (value << 1) & WORD_MASK

    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N !== this.memory.psw.C

    op1.setWord(value)
  }

  aslb(_inst: number, op1: Accessor)     { 
    let value = op1.getByte() 
    this.memory.psw.C = (value & BIT7) !== 0

    value = (value << 1) & BYTE_MASK

    this.memory.psw.N = !!(value & BIT7)
    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N !== this.memory.psw.C

    op1.setByte(value)
  }

  mark(_inst: number, _op1: Accessor) { console.error(`missing mark`) }
  mtps(_inst: number, _op1: Accessor) { console.error(`missing mtps`) }
  mfpi(_inst: number, _op1: Accessor) { console.error(`missing mfpi`) }
  mfpd(_inst: number, _op1: Accessor) { console.error(`missing mfpd`) }
  mtpi(_inst: number, _op1: Accessor) { console.error(`missing mtpi`) }
  mtpd(_inst: number, _op1: Accessor) { console.error(`missing mtpd`) }

  sxt(_inst: number, op1: Accessor)  { 
    let psw = this.memory.psw
    op1.setWord(psw.N ? 0o177777 : 0)
    psw.Z = !psw.N
  }


  mfps(_inst: number, _op1: Accessor) { console.error(`missing mpfs`) }

  brIF(bool: boolean, newPC: number) {
    if (bool)
      this.registers[PC] = newPC
  }

  br(_inst: number, newPC: number)   {
    this.brIF(true, newPC)
  }

  bne(_inst: number, newPC: number)  { 
    this.brIF(!this.memory.psw.Z, newPC)
  }

  beq(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.Z, newPC)
  }

  bpl(_inst: number, newPC: number)  { 
    this.brIF(!this.memory.psw.N, newPC)
  }

  bmi(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.N, newPC)
  }

  bvc(_inst: number, newPC: number)  { 
    this.brIF(!this.memory.psw.V, newPC)
  }

  bvs(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.V, newPC)
  }

  bcc(_inst: number, newPC: number)  { 
    this.brIF(!this.memory.psw.C, newPC)
  }

  bcs(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.C, newPC)
  }

  bge(_inst: number, newPC: number)  { 
    this.brIF(!(this.memory.psw.N !== this.memory.psw.V), newPC)
  }

  blt(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.N !== this.memory.psw.V, newPC)
  }

  bgt(_inst: number, newPC: number)  { 
    this.brIF(!(this.memory.psw.Z || (this.memory.psw.N !== this.memory.psw.V)), newPC)
  }

  ble(_inst: number, newPC: number)  { 
    this.brIF(this.memory.psw.Z || (this.memory.psw.N !== this.memory.psw.V), newPC)
  }


  bhi(_inst: number, newPC: number)  { 
    this.brIF(!(this.memory.psw.C || this.memory.psw.Z), newPC)
  }

  blos(_inst: number, newPC: number) { 
    this.brIF(this.memory.psw.C || this.memory.psw.Z, newPC)
  }




  jsr(_inst: number, op1: Accessor, rno: number, reg: number)     { 
    let target = op1.addr
    this.registers[SP] -= 2
    this.memory.setByteOrWord(this.registers[SP], reg, 2)

    if (rno !== PC)
      this.registers[rno] = this.registers[PC]
    this.registers[PC]  = target
  }

  rts(_instruction: number, rno: number, reg: number) {
    if (rno !== PC)
      this.registers[PC] = reg
    this.registers[rno] = this.memory.getByteOrWord(this.registers[SP], 2)
    this.registers[SP] += 2
  }

  dispatchVia(address: number, opcodeName: string) {
    const sp = this.registers[SP] - 4
    this.memory.setByteOrWord(sp, this.registers[PC], 2)
    this.memory.setByteOrWord(sp + 2, this.memory.psw.toWord(), 2)
    this.registers[SP] = sp
    this.registers[PC] = this.memory.getWord(address)
    this.memory.psw.fromWord(this.memory.getWord(address + 2))

    if (this.registers[PC] === 0) {
      throw new Error(`${opcodeName} issued, but there's no vector in ` +
          `locations ${octal(address)}-${octal(address + 2)}`)
    }
  }

  emt(_inst: number, func: number) { 
    if (!internallyHandledEMT(func, this.machineState)) {
      this.dispatchVia(0o30, `EMT`)
    }
  }

  trap(_inst: number)     { 
    this.dispatchVia(0o34, `TRAP`)
  }


  ccc(inst: number)     { 
    const psw = this.memory.psw
    if (inst & 0b1000) psw.N = false
    if (inst & 0b0100) psw.Z = false
    if (inst & 0b0010) psw.V = false
    if (inst & 0b0001) psw.C = false
  }

  scc(inst: number)     { 
    const psw = this.memory.psw
    if (inst & 0b1000) psw.N = true
    if (inst & 0b0100) psw.Z = true
    if (inst & 0b0010) psw.V = true
    if (inst & 0b0001) psw.C = true
  }

  rti(_inst: number)     { console.error(`missing rti`) }
  bpt(_inst: number)     { console.error(`missing bpt`) }
  iot(_inst: number)     { console.error(`missing iot`) }
  rtt(_inst: number)     { console.error(`missing rtt`) }

  halt(_inst: number)   { 
    this.machineState.processorState = PS.Halted
  }

  wait(_inst: number)    { console.error(`missing wait`) }
  reset(_inst: number)   { console.error(`missing reset`) }

}
