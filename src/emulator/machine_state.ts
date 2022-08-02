import { Memory }     from "../shared_state/memory"
import { PSW }        from "../shared_state/psw"
import { Registers }  from "../shared_state/registers"
import { SourceCode } from "../shared_state/source_code"

export type MSMemory = Memory
export type MSRegisters = Registers

// processor state
export enum RunningState  {
  Paused,
  Running,
  Trapped,
  Halted,
  Waiting,
}

export interface Callbacks {
  emtTtyout: (msg: string) => void
  emtPrint: (msg: string) => void
}


// this is stuff that used to be in the auditor
export interface Auditor {
  memory_read: (addr: number, value: number, width: Width) => void
  memory_write: (addr: number, value: number, width: Width) => void
  register_read: (rno: number, value: number) => void
  register_write: (rno: number, value: number) => void
}

enum RW { RW,  WR,  W, R, }
type Width = 1 | 2

type AccessInfo = {
  address: number,
  value:   number,
  width:   Width
  rw:      RW,
}
type AccessTracker = Record<number, AccessInfo>

export interface AdditionalStatus {
  message: string,
  pc: number
}

export interface EmulationStatus {
  memory:    MSMemory
  registers: number[]
  psw:       PSW
  runningState:    RunningState
  memory_accesses:   AccessTracker
  register_accesses: AccessTracker
  additionalStatus:  AdditionalStatus
}


export class MachineState implements Auditor {

  memory: MSMemory
  registers: MSRegisters
  runningState: RunningState
  callbacks: Callbacks
  memory_accesses:   AccessTracker
  register_accesses: AccessTracker

  constructor(callbacks: Callbacks) {
    this.memory = new Memory()
    this.registers = new Registers()
    this.callbacks = callbacks
    this.runningState = RunningState.Paused
    this.disableAccessTracking()
  }

  get psw() { return this.memory.psw }

  loadAssembledCode(assemblerOutput: SourceCode) {
    this.memory.clear()
    this.registers.clear()

    if (assemblerOutput.errorCount === 0) {
      assemblerOutput.toMemory().forEach(([addr, bytes]) => {
        if (bytes) {
          for (let byte of bytes)
            this.memory.setByte(addr++, byte)
        }
      })
      this.registers[7] = assemblerOutput.start_address
      this.registers[6] = 56 * 1024
    }
  }

  // the following is responsible for tracking accesses to
  // memory and registers

  disableAccessTracking() {
    this.memory_accesses = {}
    this.register_accesses = {}
    this.memory.setAuditor(null)
    this.registers.setAuditor(null)
  }

  enableAccessTracking() {
    this.memory_accesses = {}
    this.register_accesses = {}
    this.memory.setAuditor(this)
    this.registers.setAuditor(this)
  }

  reportAndDisable(additionalStatus: AdditionalStatus, runningState: RunningState): EmulationStatus {
    this.enableAccessTracking()

    const result: EmulationStatus = {
      memory: this.memory,
      registers: this.registers.registers,
      psw: this.psw,
      memory_accesses: this.memory_accesses,
      register_accesses: this.register_accesses,
      additionalStatus,
      runningState,
    }
    this.disableAccessTracking()
    return result
  }

  // implement the interface
  
  // MEMORY 

  memory_read(addr: number, value: number, width: Width) {
    if (addr === 0)
      debugger
    this.read(this.memory_accesses, addr & ~1, value, width)
  }

  memory_write(addr: number, value: number, width: Width) {
    this.write(this.memory_accesses, addr & ~1, value, width)
  }

  // REGISTER 

  register_read(rno: number, value: number) {
    this.read(this.register_accesses, rno, value, 2)
  }

  register_write(rno: number, value: number) {
    this.write(this.register_accesses, rno, value, 2)
  }

  // HELPERS
  
  private read(store: AccessTracker, address: number, value: number, width: Width) {
    let newFlag: RW

    switch (store[address]?.rw) {
      case RW.RW: case RW.WR: case RW.W: case undefined:
        newFlag = RW.WR
        break
      case RW.R: default:
        newFlag = RW.R
    }

    store[address] = {
      address,
      value,
      rw:    newFlag,
      width,
    }
  }

  private write(store: AccessTracker, address: number, value: number, width: Width) {
    let newFlag: RW

    switch (store[address].rw) {
      case RW.RW: case RW.WR: case RW.R:
        newFlag = RW.RW
        break
      case RW.W: default:
        newFlag = RW.W
    }

    store[address] = {
      address,
      value: value,
      rw:    newFlag,
      width,
    }
  }
}
