import { SourceCode } from "./shared_state/source_code" 
import { Parser } from "./assembler/parser"
export { Parser } from "./assembler/parser"

export function assemble(source) {
  const assembled = new SourceCode(source)
  new Parser(assembled)
  // console.log(`\nSymbols`)
  // console.log(parser.context.symbols)
  // console.log(`\nMemory`)
  // console.log(parser.context.memory.toString())
  return assembled
}
