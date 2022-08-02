export { SourceCode, SourceLine, LineType } from "./shared_state/source_code" 
export { ErrorLine, BlankLine, CodegenLine, AssignmentLine } from "./shared_state/source_code" 
export type { AssembledLine } from "./shared_state/source_code" 
export type { LexToken } from "./assembler/lexer"
import { Parser } from "./assembler/parser"
export { Parser } from "./assembler/parser"

export type { EmulationStatus } from "./emulator/machine_state"
export { MachineState, RunningState } from "./emulator/machine_state"

export { Emulator } from "./emulator/emulator"

export function assemble(source: string) {
  const parser = new Parser(source)
  const assembled = parser.assemble()
  return assembled
}
