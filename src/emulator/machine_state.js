import { Memory } from "../shared_state/memory"
import { Registers } from "../shared_state/registers"

// processor state
export const PS = {
  Paused: 1,
  Running: 2,
  Trapped: 3,
  Halted:  4,
  Waiting: 5,
}

export class MachineState {

  constructor() {
    this.memory = new Memory()
    this.registers = new Registers()
    this.processorState = PS.Paused
  }

  get psw() { return this.memory.psw }

  loadAssembledCode(assemblerOutput) {
    console.log(assemblerOutput.toMemory())
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
