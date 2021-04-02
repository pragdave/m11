import { Memory } from "../shared_state/memory"

function validateReg(rno) {
  if (rno < 0 || rno > 7)
    throw new Error(`Invalid register number (${rno})`)

}

const registerInterface = {

  get: function get(registers, rno, receiver) {
    rno = +rno
    validateReg(rno)
    return  Reflect.get(registers, rno, receiver)
  },

  set: function set(registers, rno, value, _originalReceiver) {
    rno = +rno
    validateReg(rno)
    if (value & ~0xffff) 
      throw new Error(`Attempt to set R${rno} to a value wider than 16 bits (${value})`)
    registers[rno] = value
    return true
  },


}

export class MachineState {

  constructor() {
    this.memory = new Memory()
    this.registers = new Proxy([0, 0, 0, 0, 0, 0, 0, 0], registerInterface)
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
