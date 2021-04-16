import * as EV from "../emulator/event_recorder"

const MEMORY_SIZE = 0o200000
const PSW_ADDR    = 0o177776

const N_BIT = 0o10 
const Z_BIT = 0o04 
const V_BIT = 0o02 
const C_BIT = 0o01 


function octal(val) {
  return val.toString(8).padStart(6, `0`)
}

class PSW {

  constructor() {
    this._N = this._Z = this._V = this._C = false
  }

  toString() {
    return  (this._N ? `N` : `•`) +
            (this._Z ? `Z` : `•`) +
            (this._V ? `V` : `•`) +
            (this._C ? `C` : `•`)
  }

  toWord() {
    return  (this._N && N_BIT) |    
            (this._Z && Z_BIT) |
            (this._V && V_BIT) |
            (this._C && C_BIT) 
  }

  fromWord(word) {
    this._N = !!(word & N_BIT)
    this._Z = !!(word & Z_BIT)
    this._V = !!(word & V_BIT)
    this._C = !!(word & C_BIT)
  }

  get N()   { return this._N }
  set N(tf) { this._N = !!tf }
  
  get Z()   { return this._Z }
  set Z(tf) { this._Z = !!tf }
  
  get V()   { return this._V }
  set V(tf) { this._V = !!tf }
  
  get C()   { return this._C }
  set C(tf) { this._C = !!tf }
}

export class Memory {

  constructor() {
    const bytes = new ArrayBuffer(MEMORY_SIZE) // all zeros 
    this.ram = new DataView(bytes)
    this.psw = new PSW
  }

  recordEventsTo(target) {
    this.eventRecorder = target
  }

  record(type, args) {
    if (this.eventRecorder)
      this.eventRecorder.record(type, args)
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
    this.record(EV.MEM_READ, { addr, value, bytes: 1 })
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
    this.record(EV.MEM_WRITE, { addr, value, bytes: 1 })
    return this.ram.setUint8(addr, value)
  }

  getWord(addr) {
    if (addr & 1)
      throw new Error(`word fetch from odd address (${octal(addr)})`)

    if (addr === PSW_ADDR)
      return this.psw.toWord()

    const value = this.ram.getUint16(addr)
    this.record(EV.MEM_READ, { addr, value, bytes: 2 })
    return value
  }

  setWord(addr, value) {
    if (addr & 1)
      throw new Error(`word store from odd address (${octal(addr)})`)

    if (addr === PSW_ADDR)
      this.psw.fromWord(value)

    this.record(EV.MEM_WRITE, { addr, value, bytes: 2 })
    return this.ram.setUint16(addr, value, true)
  }

  getByteOrWord(addr, count) {
    return count === 1 ? this.getByte(addr) : this.getWord(addr)
  }

  setByteOrWord(addr, value, count) {
    return count === 1 ? this.setByte(addr, value) : this.setWord(addr, value)
  }
}
