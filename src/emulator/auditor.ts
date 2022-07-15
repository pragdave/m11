import { MSMemory, MSRegisters, PS } from "./machine_state"

type AccessType = `RW` | `WR` | `W` | `R`
type AccessTracker = Record<number, AccessType>

export interface AdditionalStatus {
  message: string,
  pc: number
}

export class Auditor {

  memory: MSMemory
  registers: MSRegisters
  psw: PS

  memory_accesses: AccessTracker
  register_accesses: AccessTracker

  constructor(memory: MSMemory, registers: MSRegisters, psw: PS) {
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

  reportAndDisable(additionalStatus: AdditionalStatus, processorState: PS) {
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

  memory_read(addr: number, _value: number, _bytes: number) {
    if (addr === 0)
      debugger
    this.read(this.memory_accesses, addr & ~1)
  }

  memory_write(addr: number, _value: number, _bytes: number) {
    this.write(this.memory_accesses, addr & ~1)
  }

  // REGISTER 

  register_read(rno: number, _value: number) {
    this.read(this.register_accesses, rno)
  }

  register_write(rno: number, _value: number) {
    this.write(this.register_accesses, rno)
  }

  // HELPERS
  
  read(store: AccessTracker, key: number) {
    let newFlag: AccessType

    switch (store[key]) {
      case `RW`: case `WR`: case `W`:
        newFlag = `WR`
        break
      case `R`: default:
        newFlag = `R`
    }

    store[key] = newFlag
  }

  write(store: AccessTracker, key: number) {
    let newFlag: AccessType

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
