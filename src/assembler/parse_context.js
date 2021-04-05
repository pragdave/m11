import { SymbolTable } from "./symbol_table"
import { otherError } from "./util"
import { Memory, MemInstruction, MemOperand } from "./memory"
import { octal } from "../helpers"

export class ParseContext {

  constructor() {
    this.symbols = new SymbolTable()
    this.symbols.addLabel(`.`, 0o1000)
  }

  resetBeforePass() {
    this.generated = {}
    this.forward_references = {}
    this.memory = new Memory()
    this.symbols.setValueOf(`.`, 0o1000)
  }

  get clc() { return this.symbols.getValueOf(`.`) }
  set clc(val) { this.symbols.setValueOf(`.`, val) }


  addLabel(symbol) {
    if (symbol.endsWith(`:`))
      symbol = symbol.slice(0, -1)

    this.symbols.addLabel(symbol, this.clc)
  }

  addAssigned(name, value) {
    this.symbols.addAssigned(name, value)
  }

  lookupSymbol(name) {
    return this.symbols.lookup(name)
  }

  addInstruction(instruction, additionalWords) {
    const allWords = [ instruction ]

    this.storeWordInMemory(instruction, MemInstruction)
    if (additionalWords) {
      additionalWords.forEach(word => {
        this.storeWordInMemory(word, MemOperand)
        allWords.push(word)
      })
    }

    return allWords
  }

  addForwardReference(symbol, lineNo) {
    this.forward_references[symbol] = lineNo
  }

  hasForwardReferences() {
    return Object.keys(this.forward_references).length > 0
  }

  unresolvedForwardReferences() {
    const result = {}

    for (let k of Object.keys(this.forward_references)) {
      if (!this.lookupSymbol(k))
        result[k] = this.forward_references[k]
    }
    return result
  }

  storeByteInMemory(value, _type) {
    this.memory.setByte(this.clc++, value & 0xff)
  }

  storeWordInMemory(value, _type) {
    if ((this.clc & 1) === 0) {
      this.memory.setWord(this.clc, value)
      this.clc += 2
    }
    else
      otherError(`Attempt to store a word (${octal(value)}) at an odd address (${octal(this.clc)})`)
  }
}


