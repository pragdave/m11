import { Auditor } from "../emulator/auditor"

export class Registers {

  public registers: number[]
  private auditor: Auditor

  constructor() {
    this.clear()
  }

  get [0]()       { return this.rget(0) }
  set [0](val)    { this.rset(0, val)   }

  get [1]()       { return this.rget(1) }
  set [1](val)    { this.rset(1, val)   }

  get [2]()       { return this.rget(2) }
  set [2](val)    { this.rset(2, val)   }

  get [3]()       { return this.rget(3) }
  set [3](val)    { this.rset(3, val)   }

  get [4]()       { return this.rget(4) }
  set [4](val)    { this.rset(4, val)   }

  get [5]()       { return this.rget(5) }
  set [5](val)    { this.rset(5, val)   }

  get [6]()       { return this.rget(6) }
  set [6](val)    { this.rset(6, val)   }

  get [7]()       { return this.rget(7) }
  set [7](val)    { this.rset(7, val)   }

  get [`sp`]()    { return this.rget(6) }
  set [`sp`](val) { this.rset(6, val)   }

  get [`pc`]()    { return this.rget(7) }
  set [`pc`](val) { this.rset(7, val)   }


  rget(rno: number) {
    const value = this.registers[rno]
    if (this.auditor)
      this.auditor.register_read(rno, value)
    return value
  }

  rset(rno: number, value: number) {
    if (value & ~0xffff) 
      throw new Error(`Attempt to set R${rno} to a value wider than 16 bits (${value})`)
    if (this.auditor)
      this.auditor.register_write(rno, value)
    this.registers[rno] = value
  }

  clear() {
    this.registers = [ 0, 0, 0, 0, 0, 0, 0, 0 ]
  }

  setAuditor(auditor: Auditor) {
    this.auditor = auditor
  }
}
