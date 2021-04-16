import { Memory } from "../shared_state/memory"
import { Registers } from "../shared_state/registers"
import * as EV from "../emulator/event_recorder"

function validateReg(rno) {
  if (rno < 0 || rno > 7)
    throw new Error(`Invalid register number (${rno})`)

}

// const registerInterface = {

//   get: function get(registers, rno, receiver) {
//     validateReg(rno)
//     const value =  Reflect.get(registers, rno, receiver)
//     this.record(EV.REG_READ, { rno, value })
//     return value
//   },

//   set: function set(registers, rno, value, receiver) {
//     if (rno === `record`) {    // must be a better way...
//       this.record = value
//       return value
//     }
//     else {
//       validateReg(rno)
//       if (value & ~0xffff) 
//         throw new Error(`Attempt to set R${rno} to a value wider than 16 bits (${value})`)
//       this.record(EV.REG_WRITE, { rno, value })
//       return  Reflect.set(registers, rno, value, receiver)
//     }
//   },

// }



export class MachineState {

  constructor() {
    this.memory = new Memory()
    this.registers = new Registers()
  }

  recordEventsTo(recorder) {
    this.registers.recordEventsTo(recorder)
    this.memory.recordEventsTo(recorder)
  }

  record(type, args) {
    if (this.eventRecorder)
      this.eventRecorder.record(type, args)
  }

  get psw() { return this.memory.psw }

  loadAssembledCode(assemblerOutput) {
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
