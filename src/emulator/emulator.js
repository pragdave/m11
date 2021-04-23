import { decodeTable } from "./instruction_decode"
import { octal, saddw } from "../helpers"
import { Auditor } from "./auditor"
import { internallyHandledEMT } from "./extensions"
import { PS } from "./machine_state"

const SP = 6, PC = 7

const BIT15     = 0o100000
const WORD_MASK = 0o177777

const BIT7      = 0o000200
const BYTE_MASK = 0o000377

const Mask = [ 0, BYTE_MASK, WORD_MASK ]  // indexed by byte count

function additiveOverflow(src, dst, result) {
  return ((src & BIT15) === (dst & BIT15)) &&   // different sign
    ((dst & BIT15) !== (result & BIT15)) // dst same as result
}

function subtractiveOverflow(minuend, subtrahend, result, msb = BIT15) {
  return ((minuend & msb) ^ (subtrahend & msb)) &&   // different sign
    ((subtrahend & msb) === (result & msb)) // subtrahend same as result
}


export class Emulator {

  constructor(machineState) {
    this.machineState = machineState
    this.registers    = machineState.registers
    this.memory       = machineState.memory
    this.auditor      = new Auditor(this.memory, this.registers, this.machineState.psw)
  }

  trap(reason) { // extension point...
    throw new Error(reason)
  }


  getEmulationState(callback = null) {
    let additionalStatus

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

    return this.auditor.reportAndDisable(additionalStatus, this.machineState.processorState)
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

  decodeAndRun(instruction) {
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


  // decode operands, fetching words after the instruction and adjusting the clc accordingly

  fetchNextWordIfNeeded(dd) {
    // always fetch for index and index deferred. Also fetch of 27 or 37 (immediate or absolute)
    dd = dd & 0o77 
    const mode = dd & 0o60
    if (mode === 0o60 || dd === 0o27 || dd === 0o37) {
      return this.fetchAtPC()
    }
    return null
  }

  decode_single(handler, instruction) {
    let op = this.fetchNextWordIfNeeded(instruction) 
    this[handler](instruction, op)
  }

  decode_one_and_a_half(handler, instruction) {
    const op = this.fetchNextWordIfNeeded(instruction) 
    const rno = (instruction >> 6) & 7
    let reg = this.registers[rno]
    this[handler](instruction, op, rno, reg)
  }

  decode_double(handler, instruction) {
    const op1 = this.fetchNextWordIfNeeded(instruction >> 6)
    const op2 = this.fetchNextWordIfNeeded(instruction)
    this[handler](instruction, op1, op2)
  }

  decode_branch(handler, instruction) {
    let offset = instruction & 0xff
    if (offset & 0x80) 
      offset -= 256

    const newPC = this.registers[PC] + 2 * offset

    this[handler](instruction, newPC)
  }

  decode_jsr(handler, instruction) {
    this.decode_one_and_a_half(handler, instruction)
  }

  decode_sob(handler, instruction) {
    const offset = instruction  & 0o77
    const rno = (instruction >> 6) & 7
    let reg = this.registers[rno]
    this[handler](instruction, rno, reg, offset)
  }

  decode_rts(handler, instruction) {
    const rno = instruction  & 7
    let reg = this.registers[rno]
    this[handler](instruction, rno, reg)
  }

  decode_trap(handler, instruction) {
    const func = instruction & 0xff
    this[handler](instruction, func)
  }

  decode_cc(handler, instruction) {
    this[handler](instruction)
    return handler // just until all opcodes implemented
  }

  decode_none(handler, instruction) {
    this[handler](instruction)
    return handler // just until all opcodes implemented
  }



  fetchViaDD(dd, bytes, possibleOperand, forJump = false) {
    dd &= 0o77
    const mode = dd >> 3
    const rno  = dd & 7
    let reg  = this.registers[rno]
    let result
    let addr
    let offset

    switch (mode) {
      case 0:   // Rn
        if (forJump)
          this.trap(`attempt to jmp/jsr to a register ${rno}`)
        result = reg
        break

      case 1:   // (Rn)
        if (forJump)
          result = reg
        else
          result = this.memory.getByteOrWord(reg, bytes)
        break

      case 2:   // (Rn)+
        if (rno === 7)
          result = possibleOperand
        else {
          if (forJump)
            result = reg
          else
            result = this.memory.getByteOrWord(reg, bytes)
          this.registers[rno] = reg + bytes
        }
        break

      case 3:   // @(Rn)+
        if (rno === 7)
          addr = possibleOperand
        else {
          addr = this.memory.getWord(reg)
          this.registers[rno] += 2
        }
        result = forJump ? addr : this.memory.getByteOrWord(addr, bytes)
        break

      case 4:  // -(Rn)
        reg -= bytes
        result = forJump ? reg : this.memory.getByteOrWord(reg, bytes)
        this.registers[rno] = reg
        break

      case 5:  // @-(Rn)
        reg -= 2
        addr = this.memory.getWord(reg)
        result = forJump ? addr : this.memory.getByteOrWord(addr, bytes)
        this.registers[rno] = reg
        break

      case 6:
        offset = possibleOperand
        reg = this.registers[rno]
        result = saddw(offset, reg)
        if (!forJump)
          result = this.memory.getByteOrWord(result, bytes)
        break

      case 7: // @X(Rn)
        offset = possibleOperand
        reg = this.registers[rno]
        addr = saddw(offset,  reg)
        addr = this.memory.getWord(addr)
        result = forJump ? addr : this.memory.getByteOrWord(addr, bytes)
        break
    }
    return result & Mask[bytes]
  }

  storeViaDD(dd, value, bytes, possibleOperand) {
    dd &= 0o77
    const mode = dd >> 3
    const rno  = dd & 7
    let reg  = this.registers[rno]
    let addr
    let offset

    value &= Mask[bytes]

    switch (mode) {
      case 0:   // Rn
        if (bytes === 1)
          this.registers[rno] = (reg & 0xff00) | (value & 0xff)
        else
          this.registers[rno] = value
        break

      case 1:   // (Rn)
        this.memory.setByteOrWord(reg, value, bytes)
        break

      case 2:   // (Rn)+
        if (rno === 7)
          throw new Error(`Attempted to store value (${octal(value)}) into immediate operand`)

        this.memory.setByteOrWord(reg, value, bytes)
        if (rno !== 7)
          this.registers[rno] += bytes
        break

      case 3:   // @(Rn)++
        if (rno === 7)
          this.memory.setByteOrWord(possibleOperand, value, bytes)
        else {
          addr = this.memory.getWord(reg)
          this.memory.setByteOrWord(addr, value, bytes)
          this.registers[rno] += 2
        }
        break

      case 4:  // -(Rn)
        reg -= bytes
        this.memory.setByteOrWord(reg, value, bytes)
        this.registers[rno] = reg
        break

      case 5:  // @-(Rn)
        reg -= 2
        addr = this.memory.getWord(reg)
        this.memory.setByteOrWord(addr, value, bytes)
        this.registers[rno] = reg
        break

      case 6:
        offset = possibleOperand
        reg = this.registers[rno]
        addr = saddw(offset, reg)
        this.memory.setByteOrWord(addr, value, bytes)
        break

      case 7: // @X(Rn)
        offset = possibleOperand
        reg = this.registers[rno]
        addr = saddw(offset,  reg)
        addr = this.memory.getWord(addr)
        this.memory.setByteOrWord(addr, value, bytes)
        break
    }
  }


  ////////////////////////////////////////////////////////////////////////////////
  //
  // The instructions, ordered by operand field length 
  //
  ////////////////////////////////////////////////////////////////////////////////

    mov(inst, op1, op2)     { 
      const value = this.fetchViaDD(inst >> 6, 2, op1)
      this.storeViaDD(inst, value, 2, op2)
      this.memory.psw.Z = value === 0
      this.memory.psw.N = value & BIT15
      this.memory.psw.V = false
    }

  movb(inst, op1, op2)    { 
    let value = this.fetchViaDD(inst >> 6, 1, op1)
    const dest = inst & 0o000377

    // mode zero (register target) sign extends...
    if (dest & 0o70) {
      this.storeViaDD(inst, value, 1, op2)
    }
    else {
      if (value & 0x80)
        value |= 0xff00
      this.storeViaDD(inst, value, 2, op2)
    }

    this.memory.psw.Z = value === 0
    this.memory.psw.N = value & BIT15
    this.memory.psw.V = false
  }

  cmp(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const result = src + ~dst + 1
    psw.N = result & BIT15
    psw.Z = (result & WORD_MASK) === 0
    this.memory.psw.V = subtractiveOverflow(src, dst, result)
    this.memory.psw.C = result & ~WORD_MASK
  }

  cmpb(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 1, op1)
    const dst = this.fetchViaDD(inst, 1, op2)
    const result = src + ~dst + 1
    psw.N = result & BIT7
    psw.Z = (result & BYTE_MASK) === 0
    this.memory.psw.V = subtractiveOverflow(src, dst, result, BIT7)
    this.memory.psw.C = result & ~BYTE_MASK
  }

  bit(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const value = src & dst
    psw.N = value & BIT15
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected 
  }

  bitb(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 1, op1)
    const dst = this.fetchViaDD(inst, 1, op2)
    const value = src & dst
    psw.N = value & BIT7
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bic(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const value = (~src) & dst
    this.storeViaDD(inst, value, 2, op2)
    psw.N = value & BIT15
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bicb(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 1, op1)
    const dst = this.fetchViaDD(inst, 1, op2)
    const value = (~src) & dst
    this.storeViaDD(inst, value, 1, op2)
    psw.N = value & BIT7
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bis(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const value = src | dst
    this.storeViaDD(inst, value, 2, op2)
    psw.N = value & BIT15
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  bisb(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 1, op1)
    const dst = this.fetchViaDD(inst, 1, op2)
    const value = src | dst
    this.storeViaDD(inst, value, 1, op2)
    psw.N = value & BIT7
    psw.Z = value === 0
    psw.V = false
    // psw.C not affected
  }

  add(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const result = src + dst

    psw.Z = (result & WORD_MASK) === 0
    psw.N = (result & BIT15) 
    psw.V = additiveOverflow(src, dst, result)
    psw.C = (result & ~WORD_MASK)
    this.storeViaDD(inst, result, 2, op2)
  }

  sub(inst, op1, op2)     { 
    const psw = this.memory.psw
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2, op1)
    const dst = this.fetchViaDD(inst, 2, op2)
    const result = dst - src

    psw.Z = (result & WORD_MASK) === 0
    psw.N = (result & BIT15) 
    psw.V = subtractiveOverflow(dst, src, result)
    psw.C = (result & ~WORD_MASK)
    this.storeViaDD(inst, result, 2, op2)
  }

  mul(inst, op1, rno, reg)     { 
    const psw = this.memory.psw
    let src = this.fetchViaDD(inst, 2, op1)

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

  div(inst, op1, rno, reg)     { 
    const psw = this.memory.psw
    let src = this.fetchViaDD(inst, 2, op1)
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

      if (Math.abs(quotient > 32767)) {
        psw.V = true
      }

      this.registers[rno] = quotient & 0xffff
      this.registers[rno + 1] = remainder

      psw.N = quotient < 0
      psw.Z = quotient === 0
    }

  }

  ash(inst, op1)     { console.error(`missing ash`) }
  ashc(inst, op1)    { console.error(`missing ashc`) }

  xor(inst, op1, _rno, reg) {
    const psw = this.memory.psw
    const dst = this.fetchViaDD(inst, 2, op1)
    const result = reg ^ dst
    this.storeViaDD(inst, result, 2, op1)

    psw.N = result & BIT15
    psw.Z = result === 0
    psw.V = false
    // psw.C unchanged

  }


  sob(_inst, rno, reg, offset) { 
    reg -= 1 
    this.registers[rno] = reg & 0xffff
    if (reg !== 0) {
      this.registers[PC] -= 2 * offset
    }
  }

  jmp(inst, op1) {
    const target = this.fetchViaDD(inst, 2, op1, /*forJump = */true)
    this.registers[PC] = target
  }

  swab(inst, op1)     { 
    let psw = this.memory.psw
    let value = this.fetchViaDD(inst, 2, op1) 

    let lob = value & 0xff
    value = (value >> 8) | (lob << 8)

    this.storeViaDD(inst, value, 2, op1)

    lob = value & 0xff
    psw.N = lob & BIT7
    psw.Z = lob === 0 
    psw.V = false
    psw.C = false
  }


  clr(inst, op1, bytes = 2) { 
    this.storeViaDD(inst, 0, bytes, op1)
    this.memory.psw.Z = true
    this.memory.psw.N = false
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  clrb(inst, op1) {
    this.clr(inst, op1, 1)
  }

  com(inst, op1) {
    const value = (~this.fetchViaDD(inst, 2, op1)) & WORD_MASK
    this.storeViaDD(inst, value, 2, op1)
    this.memory.psw.Z = value === 0
    this.memory.psw.N = value & BIT15
    this.memory.psw.V = false
    this.memory.psw.C = true
  }

  comb(inst, op1) {
    const value = (~this.fetchViaDD(inst, 1, op1)) & BYTE_MASK
    this.storeViaDD(inst, value, 1, op1)
    this.memory.psw.Z = value === 0
    this.memory.psw.N = value & BIT7
    this.memory.psw.V = false
    this.memory.psw.C = true
  }


  inc(inst, op1)     {
    let value = this.fetchViaDD(inst, 2, op1) 
    this.memory.psw.V = value === 0o077777

    value += 1
    this.storeViaDD(inst, value, 2, op1)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = value & BIT15
  }

  incb(inst, op1)     {
    let value = this.fetchViaDD(inst, 1, op1) 
    this.memory.psw.V = value === 0o000177
    value += 1
    this.storeViaDD(inst, value, 1, op1)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = value & BIT7
  }

  dec(inst, op1)     { 
    let value = this.fetchViaDD(inst, 2, op1) 
    this.memory.psw.V = value === 0o100000

    value -= 1
    this.storeViaDD(inst, value, 2, op1)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = value & BIT15
  }

  decb(inst, op1)     { 
    let value = this.fetchViaDD(inst, 1, op1) 
    this.memory.psw.V = value === 0o000200

    value -= 1
    this.storeViaDD(inst, value, 1, op1)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = value & BIT7
  }

  neg(inst, op1)     { 
    let value = this.fetchViaDD(inst, 2, op1) 
    this.memory.psw.V = value === 0o100000

    value = (-value)  & WORD_MASK

    this.storeViaDD(inst, value, 2, op1)
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.N = value & BIT15
    this.memory.psw.C = !this.memory.psw.Z
  }

  negb(inst, op1)     { 
    let value = this.fetchViaDD(inst, 1, op1) 
    this.memory.psw.V = value === 0o200

    value = (-value)  & BYTE_MASK

    this.storeViaDD(inst, value, 1, op1)
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.N = value & BIT7
    this.memory.psw.C = !this.memory.psw.Z
  }

  adc(inst, op1)     { 
    const psw = this.memory.psw
    let value = this.fetchViaDD(inst, 2, op1) 
    if (psw.C) {
      psw.V = value === 0o077777
      psw.C = value === 0o177777 
      value = (value + 1) & WORD_MASK
      this.storeViaDD(inst, value, 2, op1)
    }
    psw.N = value & BIT15
    psw.Z = value === 0
  }

  adcb(inst, op1)     { 
    const psw = this.memory.psw
    let value = this.fetchViaDD(inst, 2, op1) 
    if (psw.C) {
      psw.V = value === 0o077777
      psw.C = value === 0o177777 
      value = (value + 1) & WORD_MASK
      this.storeViaDD(inst, value, 2, op1)
    }
    psw.N = value & BIT15
    psw.Z = value === 0
  }

  sbc(inst, op1)     { 
    const psw = this.memory.psw
    let value = this.fetchViaDD(inst, 2, op1) 
    if (psw.C) {
      psw.V = value === 0o100000
      psw.C = value !== 0
      value = (value - 1) & WORD_MASK
      this.storeViaDD(inst, value, 2, op1)
    }
    psw.N = value & BIT15
    psw.Z = value === 0
  }

  sbcb(inst, op1)     { 
    const psw = this.memory.psw
    let value = this.fetchViaDD(inst, 1, op1) 
    if (psw.C) {
      psw.V = value === 0o000200
      psw.C = value !== 0o000000
      value = (value - 1) & BYTE_MASK
      this.storeViaDD(inst, value, 1, op1)
    }
    psw.N = value & BIT7 
    psw.Z = value === 0
  }

  tst(inst, op1)     {
    let value = this.fetchViaDD(inst, 2, op1) 
    this.memory.psw.N = value & BIT15
    this.memory.psw.Z = (value & WORD_MASK) === 0
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  tstb(inst, op1)     {
    let value = this.fetchViaDD(inst, 1, op1) 
    this.memory.psw.N = value & BIT7
    this.memory.psw.Z = (value & BYTE_MASK) === 0
    this.memory.psw.V = false
    this.memory.psw.C = false
  }

  ror(inst, op1)     { 
    const psw = this.memory.psw

    let value = this.fetchViaDD(inst, 2, op1) 
    const cbit = value & 1
    value >>= 1

    if (psw.C) {
      value = value | BIT15
      psw.N = true
    }
    else
      psw.N = false

    psw.C = cbit
    psw.Z = value === 0
    psw.V = psw.N ^ psw.C

    this.storeViaDD(inst, value, 2, op1)
  }

  rorb(inst, op1)     { 
    const psw = this.memory.psw

    let value = this.fetchViaDD(inst, 1, op1) 
    const cbit = value & 1
    value >>= 1

    if (psw.C) {
      value = value | BIT7
      psw.N = true
    }
    else
      psw.N = false

    psw.C = cbit
    psw.Z = value === 0
    psw.V = psw.N ^ psw.C

    this.storeViaDD(inst, value, 1, op1)
  }

  rol(inst, op1)     { 
    const psw = this.memory.psw

    let value = this.fetchViaDD(inst, 2, op1) 
    const cbit = value & BIT15
    value = (value << 1) & WORD_MASK

    if (psw.C) {
      value = value | 1
    }

    psw.N = value & BIT15
    psw.C = cbit
    psw.Z = value === 0
    psw.V = psw.N ^ psw.C

    this.storeViaDD(inst, value, 2, op1)
  }

  rolb(inst, op1)     { 
    const psw = this.memory.psw

    let value = this.fetchViaDD(inst, 1, op1) 
    const cbit = value & BIT7
    value = (value << 1) & BYTE_MASK

    if (psw.C) {
      value = value | 1
    }

    psw.N = value & BIT7
    psw.C = cbit
    psw.Z = value === 0
    psw.V = psw.N ^ psw.C

    this.storeViaDD(inst, value, 1, op1)
  }


  asr(inst, op1)     { 
    let value = this.fetchViaDD(inst, 2, op1) 
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
    this.memory.psw.V = this.memory.psw.N ^ this.memory.psw.C

    this.storeViaDD(inst, value, 2, op1)
  }

  asrb(inst, op1)     { 
    let value = this.fetchViaDD(inst, 1, op1) 
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
    this.memory.psw.V = this.memory.psw.N ^ this.memory.psw.C

    this.storeViaDD(inst, value, 1, op1)
  }


  asl(inst, op1)     { 
    let value = this.fetchViaDD(inst, 2, op1) 
    this.memory.psw.C = (value & BIT15) !== 0

    value = (value << 1) & WORD_MASK

    this.memory.psw.N = value & BIT15
    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N ^ this.memory.psw.C

    this.storeViaDD(inst, value, 2, op1)
  }

  aslb(inst, op1)     { 
    let value = this.fetchViaDD(inst, 1, op1) 
    this.memory.psw.C = (value & BIT7) !== 0

    value = (value << 1) & BYTE_MASK

    this.memory.psw.N = value & BIT7
    this.memory.psw.Z = value === 0
    this.memory.psw.V = this.memory.psw.N ^ this.memory.psw.C

    this.storeViaDD(inst, value, 1, op1)
  }

  mark(inst, op1) { console.error(`missing mark`) }
  mtps(inst, op1) { console.error(`missing mtps`) }
  mfpi(inst, op1) { console.error(`missing mfpi`) }
  mfpd(inst, op1) { console.error(`missing mfpd`) }
  mtpi(inst, op1) { console.error(`missing mtpi`) }
  mtpd(inst, op1) { console.error(`missing mtpd`) }

  sxt(inst, op1)  { 
    let psw = this.memory.psw
    this.storeViaDD(inst, psw.N ? 0o177777 : 0, 2, op1)
    psw.Z = !psw.N
  }


  mfps(inst, op1) { console.error(`missing mpfs`) }

  brIF(bool, newPC) {
    if (bool)
      this.registers[PC] = newPC
  }

  br(_inst, newPC)   {
    this.brIF(true, newPC)
  }

  bne(_inst, newPC)  { 
    this.brIF(!this.memory.psw.Z, newPC)
  }

  beq(_inst, newPC)  { 
    this.brIF(this.memory.psw.Z, newPC)
  }

  bpl(_inst, newPC)  { 
    this.brIF(!this.memory.psw.N, newPC)
  }

  bmi(_inst, newPC)  { 
    this.brIF(this.memory.psw.N, newPC)
  }

  bvc(_inst, newPC)  { 
    this.brIF(!this.memory.psw.V, newPC)
  }

  bvs(_inst, newPC)  { 
    this.brIF(this.memory.psw.V, newPC)
  }

  bcc(_inst, newPC)  { 
    this.brIF(!this.memory.psw.C, newPC)
  }

  bcs(_inst, newPC)  { 
    this.brIF(this.memory.psw.C, newPC)
  }

  bge(_inst, newPC)  { 
    this.brIF(!(this.memory.psw.N ^ this.memory.psw.V), newPC)
  }

  blt(_inst, newPC)  { 
    this.brIF(this.memory.psw.N ^ this.memory.psw.V, newPC)
  }

  bgt(_inst, newPC)  { 
    this.brIF(!(this.memory.psw.Z || (this.memory.psw.N ^ this.memory.psw.V)), newPC)
  }

  ble(_inst, newPC)  { 
    this.brIF(this.memory.psw.Z || (this.memory.psw.N ^ this.memory.psw.V), newPC)
  }


  bhi(_inst, newPC)  { 
    this.brIF(!(this.memory.psw.C || this.memory.psw.Z), newPC)
  }

  blos(_inst, newPC) { 
    this.brIF(this.memory.psw.C || this.memory.psw.Z, newPC)
  }




  jsr(inst, op1, rno, reg)     { 
    let target = this.fetchViaDD(inst, 2, op1, /*forJump=*/ true)
    this.registers[SP] -= 2
    this.memory.setByteOrWord(this.registers[SP], reg, 2)

    if (rno !== PC)
      this.registers[rno] = this.registers[PC]
    this.registers[PC]  = target
  }

  rts(_instruction, rno, reg) {
    if (rno !== PC)
      this.registers[PC] = reg
    this.registers[rno] = this.memory.getByteOrWord(this.registers[SP], 2)
    this.registers[SP] += 2
  }

  dispatchVia(address, opcodeName) {
    const sp = this.registers[SP] - 4
    this.memory.setByteOrWord(sp, this.registers[PC])
    this.memory.setByteOrWord(sp + 2, this.memory.psw.toWord())
    this.registers[SP] = sp
    this.registers[PC] = this.memory.getWord(address)
    this.memory.psw.fromWord(this.memory.getWord(address + 2))

    if (this.registers[PC] === 0) {
      throw new Error(`${opcodeName} issued, but there's no vector in ` +
          `locations ${octal(address)}-${octal(address + 2)}`)
    }
  }

  emt(_inst, func) { 
    if (!internallyHandledEMT(func, this.machineState)) {
      this.dispatchVia(0o30, `EMT`)
    }
  }

  trap(_inst)     { 
    this.dispatchVia(0o34, `TRAP`)
  }


  ccc(inst)     { 
    const psw = this.memory.psw
    if (inst & 0b1000) psw.N = false
    if (inst & 0b0100) psw.Z = false
    if (inst & 0b0010) psw.V = false
    if (inst & 0b0001) psw.C = false
  }

  scc(inst)     { 
    const psw = this.memory.psw
    if (inst & 0b1000) psw.N = true
    if (inst & 0b0100) psw.Z = true
    if (inst & 0b0010) psw.V = true
    if (inst & 0b0001) psw.C = true
  }

  rti(inst)     { console.error(`missing rti`) }
  bpt(inst)     { console.error(`missing bpt`) }
  iot(inst)     { console.error(`missing iot`) }
  rtt(inst)     { console.error(`missing rtt`) }

  halt(_inst)   { 
    this.machineState.processorState = PS.Halted
  }

  wait(inst)    { console.error(`missing wait`) }
  reset(inst)   { console.error(`missing reset`) }

}
