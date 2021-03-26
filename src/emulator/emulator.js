
const SP = 6, PC = 7

const BIT15 = 0o100000
const WORD_MASK = 0o177777

const BIT7 = 0o000200
const BYTE_MASK = 0o000377

export class Emulator {

  constructor(machine_state) {
    this.registers = machine_state.registers
    this.memory    = machine_state.memory
  }

  fetchViaDD(dd, bytes) {
    const mode = dd >> 3
    const rno  = dd & 7
    const reg  = this.registers[rno]
    let result
    let addr

    switch (mode) {
      case 0:   // Rn
        result = reg
        break

      case 1:   // (Rn)
        result = this.memory.read(reg, bytes)
        break

      case 2:   // (Rn)+
        result = this.memory.read(reg, bytes)
        this.registers[rno] += bytes
        break

      case 3:   // @(Rn)++
        addr = this.memory.read(reg, 2)
        addr = this.memory.read(addr, bytes)
        this.registers[rno] += bytes
        break

      case 4:  // -(Rn)
        reg -= bytes
        result = this.memory.read(reg, bytes)
        this.registers[rno] = reg
        break

      case 5:  // @-(Rn)
        reg -= bytes
        addr = this.memory.read(reg, 2)
        result = this.memory.read(reg, bytes)
        this.registers[rno] = reg
        break

      case 6:
        addr = this.memory.read(PC, 2) + reg
        result = this.memory.read(addr, bytes)
        this.registers[PC] += 2
        break

      case 7: // @X(Rn)
        addr = this.memory.read(PC, 2) + reg
        addr = this.memory.read(addr, 2)
        result = this.memory.read(addr, bytes)
        this.registers[PC] += 2
        break
    }
    return result
  }

  storeViaDD(dd, value, bytes) {
    const mode = dd >> 3
    const rno  = dd & 7
    const reg  = this.registers[rno]
    let addr

    switch (mode) {
      case 0:   // Rn
        this.registers[rno] = value
        break

      case 1:   // (Rn)
        this.memory.write(reg, value, bytes)
        break

      case 2:   // (Rn)+
        this.memory.write(reg, value, bytes)
        this.registers[rno] += bytes
        break

      case 3:   // @(Rn)++
        addr = this.memory.read(reg, 2)
        this.memory.write(addr, value, bytes)
        this.registers[rno] += bytes
        break

      case 4:  // -(Rn)
        reg -= bytes
        this.memory.write(reg, value, bytes)
        this.registers[rno] = reg
        break

      case 5:  // @-(Rn)
        reg -= bytes
        addr = this.memory.read(reg, 2)
        this.memory.write(addr, value, bytes)
        this.registers[rno] = reg
        break

      case 6:
        addr = this.memory.read(PC, 2) + reg
        this.memory.addr(addr, value, bytes)
        this.registers[PC] += 2
        break

      case 7: // @X(Rn)
        addr = this.memory.read(PC, 2) + reg
        addr = this.memory.read(addr, 2)
        this.memory.write(addr, value, bytes)
        this.registers[PC] += 2
        break
    }
  }


  mov(inst)     { 
    const value = this.fetchViaDD((inst >> 6), 2)
    this.storeViaDD(inst, value, 2)

    this.memory.psw.Z = value === 0
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.V = false
  }

  movb(inst)    { 
    const value = this.fetchViaDD(inst >> 6, inst, 1)
    const dest = inst & 0o000377

    // mode zero (register target) sign extends...
    if (dest & 0o70)
      this.storeViaDD(inst, value, 1)
    else
      this.storeViaDD(inst, value, 2)

    this.memory.psw.Z = value === 0
    this.memory.psw.N = !!(value & BIT15)
    this.memory.psw.V = false
  }

  cmp(inst)     { 
    const src = this.fetchViaDD((inst >> 6) & 0o77, 2)
    const dst = this.fetchViaDD(inst, 2)
    const result = src + ~dst + 1
    this.memory.psw.N = !!(result & BIT15)
    this.memory.psw.Z = !(result & WORD_MASK)
    this.memory.psw.V = ((src & BIT15) ^ (dst & BIT15)) &&   // different sign
                        ((dst & BIT15) === (result & BIT15)) // dst same as result
    this.memory.psw.O = !!(result & ~WORD_MASK)
  }
  // cmpb(operand)    { this.result = [ `cmpb`,  operand, `decode_double` ] }
  // bit(operand)     { this.result = [ `bit`,   operand, `decode_double` ] }
  // bitb(operand)    { this.result = [ `bitb`,  operand, `decode_double` ] }
  // bic(operand)     { this.result = [ `bic`,   operand, `decode_double` ] }
  // bicb(operand)    { this.result = [ `bicb`,  operand, `decode_double` ] }
  // bis(operand)     { this.result = [ `bis`,   operand, `decode_double` ] }
  // bisb(operand)    { this.result = [ `bisb`,  operand, `decode_double` ] }
  // add(operand)     { this.result = [ `add`,   operand, `decode_double` ] }
  // sub(operand)     { this.result =  [ `sub`,   operand, `decode_double` ] }

  // mul(operand)     { this.result = [ `mul`,   operand, `decode_one_and_a_half` ] }
  // div(operand)     { this.result = [ `div`,   operand, `decode_one_and_a_half` ] }
  // ash(operand)     { this.result = [ `ash`,   operand, `decode_one_and_a_half` ] }
  // ashc(operand)    { this.result = [ `ashc`,  operand, `decode_one_and_a_half` ] }
  // xor(operand)     { this.result = [ `xor`,   operand, `decode_one_and_a_half` ] }
  // sob(operand)     { this.result = [ `sob`,   operand, `decode_one_and_a_half` ] }

  // jmp(operand)     { this.result = [ `jmp`,   operand, `decode_single` ] }
  // swab(operand)    { this.result = [ `swab`,  operand, `decode_single` ] }
  // clr(operand)     { this.result = [ `clr`,   operand, `decode_single` ] }
  // clrb(operand)    { this.result = [ `clrb`,  operand, `decode_single` ] }
  // com(operand)     { this.result = [ `com`,   operand, `decode_single` ] }
  // comb(operand)    { this.result = [ `comb`,  operand, `decode_single` ] }
  // inc(operand)     { this.result = [ `inc`,   operand, `decode_single` ] }
  // incb(operand)    { this.result = [ `incb`,  operand, `decode_single` ] }
  // dec(operand)     { this.result = [ `dec`,   operand, `decode_single` ] }
  // decb(operand)    { this.result = [ `decb`,  operand, `decode_single` ] }
  // neg(operand)     { this.result = [ `neg`,   operand, `decode_single` ] }
  // negb(operand)    { this.result = [ `negb`,  operand, `decode_single` ] }
  // adc(operand)     { this.result = [ `adc`,   operand, `decode_single` ] }
  // adcb(operand)    { this.result = [ `adcb`,  operand, `decode_single` ] }
  // sbc(operand)     { this.result = [ `sbc`,   operand, `decode_single` ] }
  // sbcb(operand)    { this.result = [ `sbcb`,  operand, `decode_single` ] }
  // tst(operand)     { this.result = [ `tst`,   operand, `decode_single` ] }
  // tstb(operand)    { this.result = [ `tstb`,  operand, `decode_single` ] }
  // ror(operand)     { this.result = [ `ror`,   operand, `decode_single` ] }
  // rorb(operand)    { this.result = [ `rorb`,  operand, `decode_single` ] }
  // rol(operand)     { this.result = [ `rol`,   operand, `decode_single` ] }
  // rolb(operand)    { this.result = [ `rolb`,  operand, `decode_single` ] }
  // asr(operand)     { this.result = [ `asr`,   operand, `decode_single` ] }
  // asrb(operand)    { this.result = [ `asrb`,  operand, `decode_single` ] }
  // asl(operand)     { this.result = [ `asl`,   operand, `decode_single` ] }
  // aslb(operand)    { this.result = [ `aslb`,  operand, `decode_single` ] }
  // mark(operand)    { this.result = [ `mark`,  operand, `decode_single` ] }
  // mtps(operand)    { this.result = [ `mtps`,  operand, `decode_single` ] }
  // mfpi(operand)    { this.result = [ `mfpi`,  operand, `decode_single` ] }
  // mfpd(operand)    { this.result = [ `mfpd`,  operand, `decode_single` ] }
  // mtpi(operand)    { this.result = [ `mtpi`,  operand, `decode_single` ] }
  // mtpd(operand)    { this.result = [ `mtpd`,  operand, `decode_single` ] }
  // sxt(operand)     { this.result = [ `sxt`,   operand, `decode_single` ] }
  // mfps(operand)    { this.result = [ `mfps`,  operand, `decode_single` ] }

  // br(operand)      { this.result = [ `br`,    operand, `decode_branch` ] }
  // bne(operand)     { this.result = [ `bne`,   operand, `decode_branch` ] }
  // beq(operand)     { this.result = [ `beq`,   operand, `decode_branch` ] }
  // bge(operand)     { this.result = [ `bge`,   operand, `decode_branch` ] }
  // blt(operand)     { this.result = [ `blt`,   operand, `decode_branch` ] }
  // bgt(operand)     { this.result = [ `bgt`,   operand, `decode_branch` ] }
  // ble(operand)     { this.result = [ `ble`,   operand, `decode_branch` ] }
  // bpl(operand)     { this.result = [ `bpl`,   operand, `decode_branch` ] }
  // bmi(operand)     { this.result = [ `bmi`,   operand, `decode_branch` ] }
  // bhi(operand)     { this.result = [ `bhi`,   operand, `decode_branch` ] }
  // blos(operand)    { this.result = [ `blos`,  operand, `decode_branch` ] }
  // bvc(operand)     { this.result = [ `bvc`,   operand, `decode_branch` ] }
  // bvs(operand)     { this.result = [ `bvs`,   operand, `decode_branch` ] }
  // bcc(operand)     { this.result = [ `bcc`,   operand, `decode_branch` ] }
  // bcs(operand)     { this.result = [ `bcs`,   operand, `decode_branch` ] }

  // jsr(operand)     { this.result = [ `jsr`,   operand, `decode_jsr`    ] }

  // rts(operand)     { this.result = [ `rts`,   operand, `decode_rts`    ] }

  // emt(operand)     { this.result = [ `emt`,   operand, `decode_trap`   ] }
  // trap(operand)    { this.result = [ `trap`,  operand, `decode_trap`   ] }


  // ccc(operand)     { this.result = [ `ccc`,   operand, `decode_cc`     ] }
  // scc(operand)     { this.result = [ `scc`,   operand, `decode_cc`     ] }

  // rti(operand)     { this.result = [ `rti`,   operand, `decode_none`   ] }
  // bpt(operand)     { this.result = [ `bpt`,   operand, `decode_none`   ] }
  // iot(operand)     { this.result = [ `iot`,   operand, `decode_none`   ] }
  // rtt(operand)     { this.result = [ `rtt`,   operand, `decode_none`   ] }
  // halt(operand)    { this.result = [ `halt`,  operand, `decode_none`   ] }
  // wait(operand)    { this.result = [ `wait`,  operand, `decode_none`   ] }
  // reset(operand)   { this.result = [ `reset`, operand, `decode_none`   ] }

}
