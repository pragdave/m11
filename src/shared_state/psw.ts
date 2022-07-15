const N_BIT = 0o10 
const Z_BIT = 0o04 
const V_BIT = 0o02 
const C_BIT = 0o01 

export class PSW {

  private _N : boolean
  private _Z : boolean
  private _V : boolean
  private _C : boolean

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

  fromWord(word: number) {
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


