import * as EV from "../emulator/event_recorder"

export class Registers {

  constructor() {
    this.registers = [ 0, 0, 0, 0, 0, 0, 0, 0 ]
  }

  get [0]()       { return this.rget(0) }
  set [0](val)    { this.rset(0, val)   }

  get [1]()       { return this.rget(1) }
  set [1](val)    { this.rset(0, val)   }

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

  rget(rno) {
    const value = this.registers[rno]
    this.record(EV.REG_READ, { rno, value })
    return value
  }

  rset(rno, value) {
    if (value & ~0xffff) 
      throw new Error(`Attempt to set R${rno} to a value wider than 16 bits (${value})`)
    this.record(EV.REG_WRITE, { rno, value })
    this.registers[rno] = value
  }

  recordEventsTo(recorder) {
    this.recorder = recorder
  }

  record(type, args) {
    if (this.recorder)
      this.recorder.record(type, args)
  }
}

