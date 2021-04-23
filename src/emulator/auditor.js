export class Auditor {

  constructor(memory, registers, psw) {
    this.memory = memory
    this.registers = registers
    this.psw = psw
  }

  enable() {
    this.memory_accesses = {}
    this.register_accesses = {}
    this.memory.setAuditor(this)
    this.registers.setAuditor(this)
  }

  reportAndDisable(additionalStatus, processorState) {
    const result = {
      memory: this.memory,
      registers: this.registers.registers,
      psw: this.psw,
      memory_accesses: this.memory_accesses,
      register_accesses: this.register_accesses,
      additionalStatus,
      processorState,
    }
    this.disable()
    return result
  }

  disable() {
    this.memory.setAuditor(null)
    this.registers.setAuditor(null)
  }


  // MEMORY 

  memory_read(addr, _value, _bytes) {
    console.log(`mem read`, addr)
    if (addr === 0)
      debugger
    this.read(this.memory_accesses, addr & ~1)
  }

  memory_write(addr, _value, _bytes) {
    this.write(this.memory_accesses, addr & ~1)
  }

  // REGISTER 

  register_read(rno, _value) {
    this.read(this.register_accesses, rno)
  }

  register_write(rno, _value) {
    this.write(this.register_accesses, rno)
  }

  // HELPERS
  
  read(store, key) {
    let newFlag

    switch (store[key]) {
      case `RW`: case `WR`: case `W`:
        newFlag = `WR`
        break
      case `R`: default:
        newFlag = `R`
    }

    store[key] = newFlag
  }

  write(store, key) {
    let newFlag

    switch (store[key]) {
      case `RW`: case `WR`: case `R`:
        newFlag = `RW`
        break
      case `W`: default:
        newFlag = `W`
    }

    store[key] = newFlag
  }
}
