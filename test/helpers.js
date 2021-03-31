import { SourceCode, Parser, MachineState, Emulator } from "../src/main"

export function assembleAndRun(src) {
  const assembled = new SourceCode(src)
  const parser = new Parser(assembled)

  const state     = new MachineState()
  state.loadAssembledCode(assembled)
  const emulator = new Emulator(state)

  function normalize(addr) {
    if (typeof addr === `number`)
      return addr

    addr = parser.context.symbols.lookup(addr)
    if (addr !== undefined)
      return addr

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
