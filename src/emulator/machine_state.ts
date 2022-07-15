import { Memory } from "../shared_state/memory"
import { Registers } from "../shared_state/registers"
import { SourceCode } from "../shared_state/source_code"

export type MSMemory = Memory
export type MSRegisters = Registers

// processor state
export enum PS  {
  Paused,
  Running,
  Trapped,
  Halted,
  Waiting,
}

interface Callbacks {
  emtTtyout: (msg: string) => void
  emtPrint: (msg: string) => void
}

export class MachineState {

  memory: MSMemory
  registers: MSRegisters
  processorState: PS
  callbacks: Callbacks

  constructor(callbacks: Callbacks) {
    this.memory = new Memory()
    this.registers = new Registers()
    this.callbacks = callbacks
    this.processorState = PS.Paused
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
}
