import { Parser, MachineState, Emulator } from "../src/main"
export { octal } from "../src/helpers"

export function assembleAndRun(src) {
  const parser = new Parser(src)
  const assembled = parser.assemble()
  if (assembled.errorCount > 0) {
    throw new Error(`Test abandonned: error in assembly compilation`)
  }

  const state     = new MachineState()
  state.loadAssembledCode(assembled)
  const emulator = new Emulator(state)

  function normalize(addr) {
    if (typeof addr === `number`)
      return addr

    const actualAddr = parser.context.symbols.lookup(addr)
    if (actualAddr !== undefined)
      return actualAddr.value

    throw new Error(`Cannot find symbol "${addr}"`)
  }

  const memoryAccessor = {
    w(addr) {
      return state.memory.getWord(normalize(addr))
    },
    b(addr) {
      return state.memory.getByte(normalize(addr))
    },
  }

  return {

    step() {
      emulator.step()
      return [
        state.registers,
        memoryAccessor,
        state.psw.toString(),
      ]
    },

    symbol(name) {
      return parser.context.lookupSymbol(name)
    },

  }
}
