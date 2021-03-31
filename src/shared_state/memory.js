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


  get N()   { return this._N }
  set N(TF) { this._N = !!TF }
  
  get Z()   { return this._Z }
  set Z(TF) { this._Z = !!TF }
  
  get V()   { return this._V }
  set V(TF) { this._V = !!TF }
  
  get C()   { return this._C }
  set C(TF) { this._C = !!TF }
}

export class Memory {

  constructor() {
    const bytes = new ArrayBuffer(MEMORY_SIZE) // all zeros 
    this.ram = new DataView(bytes)
    this.psw = new PSW
  }

  getByte(addr) {
    return this.ram.getUint8(addr)
  }

  setByte(addr, value) {
    return this.ram.setUint8(addr, value)
  }

  getWord(addr) {
    if (addr & 1)
      throw new Error(`word fetch from odd address (${octal(addr)})`)
    return this.ram.getUint16(addr, true)
  }

  setWord(addr, value) {
    if (addr & 1)
      throw new Error(`word store from odd address (${octal(addr)})`)
    return this.ram.setUint16(addr, value, true)
  }

  getByteOrWord(addr, count) {
    return count === 1 ? this.getByte(addr) : this.getWord(addr)
  }

  setByteOrWord(addr, value, count) {
    return count === 1 ? this.setByte(addr, value) : this.setWord(addr, value)
  }
}
