export { SourceCode } from "./shared_state/source_code" 
import { Parser } from "./assembler/parser"
export { Parser } from "./assembler/parser"

export { Emulator } from "./emulator/emulator"
export { MachineState, PS } from "./emulator/machine_state"

export function assemble(source: string) {
  const parser = new Parser(source)
  const assembled = parser.assemble()
  return assembled
}
