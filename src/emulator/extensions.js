
const EMThandlers = {
  0o341: func_ttyout,
  0o351: func_print,
}


export function internallyHandledEMT(func, state) {
  const handler = EMThandlers[func]
  if (!handler)
    return false

  handler(state)
  return true
}

function func_ttyout(state) {
  const char = state.registers[0] & 0xff
  state.callbacks.emtTtyout(String.fromCharCode(char))
}

function func_print(state) {
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

