import { MachineState } from "./machine_state"

const EMThandlers = {
  0o341: func_ttyout,
  0o351: func_print,
}


export function internallyHandledEMT(func: number, state: MachineState) {
  const handler = EMThandlers[func]
  if (!handler)
    return false

  handler(state)
  return true
}

function func_ttyout(state: MachineState) {
  const char = state.registers[0] & 0xff
  state.callbacks.emtTtyout(String.fromCharCode(char))
}

function func_print(state: MachineState) {
  let addr = state.registers[0]
  let maxCount = 100
  let result = []

  while (maxCount-- > 0) {
    let char = state.memory.getByte(addr++)
    if (char === 0x80)
      break
    if (char === 0x00) {
      result.push(`\n`)
      break
    }
    result.push(String.fromCharCode(char))
  }

  state.callbacks.emtPrint(result.join(``))
}

