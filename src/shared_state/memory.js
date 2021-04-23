import { PSW } from "./psw"

const MEMORY_SIZE = 0o200000
const PSW_ADDR    = 0o177776


function octal(val) {
  return val.toString(8).padStart(6, `0`)
}

export class Memory {

  constructor() {
    this.clear()
    this.psw = new PSW
  }

  clear() {
    const bytes = new ArrayBuffer(MEMORY_SIZE) // all zeros 
    this.ram = new DataView(bytes)
  }

  setAuditor(auditor) {
    this.auditor = auditor
  }

  getByte(addr) {
    if (addr >= PSW_ADDR) {
      const psw = this.psw.toWord()
      if (addr & 1)
        return (psw >> 8) & 0xff
      else
        return psw & 0xff
    }
    const value = this.ram.getUint8(addr)
    this.auditor?.memory_read(addr, value, /* bytes: */ 1)
    return value
  }

  setByte(addr, value) {
    if (addr >= PSW_ADDR) {
      const psw = this.psw.toWord()
      if (addr & 1)
        psw = psw & 0xff | (value << 8)
      else
        psw = psw & 0xff00 | value

      this.psw.fromWord(psw)
    }
    this.auditor?.memory_write(addr, value, /* bytes: */ 1)
    return this.ram.setUint8(addr, value)
  }

  getWord(addr, audit = true) {
    if (addr & 1)
      throw new Error(`word fetch from odd address (${octal(addr)})`)

    if (addr === PSW_ADDR)
      return this.psw.toWord()

    const value = this.ram.getUint16(addr, true)
    if (audit && this.auditor) 
      this.auditor.memory_read(addr, value, /* bytes: */ 2)
    return value
  }

  setWord(addr, value) {
    if (addr & 1)
      throw new Error(`word store from odd address (${octal(addr)})`)

    if (addr === PSW_ADDR)
      this.psw.fromWord(value)

    this.auditor?.memory_write(addr, value, /* bytes: */ 2)
    return this.ram.setUint16(addr, value, true)
  }

  getByteOrWord(addr, count) {
    return count === 1 ? this.getByte(addr) : this.getWord(addr)
  }

  setByteOrWord(addr, value, count) {
    return count === 1 ? this.setByte(addr, value) : this.setWord(addr, value)
  }
}
