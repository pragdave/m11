import { otherError } from "./util"

enum SymbolType  {
  undefined,
  label,
  assigned,
}

export class SymbolTableEntry {

  name: string
  value: number
  type: SymbolType

  constructor(name: string, value: number, type: SymbolType) {
    this.name = name
    this.value = value
    this.type = type
  }

  isDefined() {
    return this.type !== SymbolType.undefined
  }
}

type Table = Record<string, SymbolTableEntry>

export class SymbolTable {

  private symbols: Table = {}

  constructor() {
    this.symbols = {}
  }

  lookup(name: string) {
    return this.symbols[name]
  }

  getValueOf(name: string): number | undefined {
    const sym = this.lookup(name)
    if (sym)
      return sym.value
    else
      return undefined
  }

  setValueOf(name: string, value: number) {
    const sym = this.lookup(name)
    if (sym)
      sym.value = value
    else
      otherError(`attempt to update nonexistent symbol "${name}"`)
  }

  addValue(name: string, value: number, type: SymbolType) {
    if (name !== `.` && name in this.symbols) {
      if (this.symbols[name].value !== value) {
        otherError(`SymbolTableEntry "${name}" has multiple values (maybe a duplicate definition?)`)
      }
    }
    else {
      this.symbols[name] = new SymbolTableEntry(name, value, type)
    }
  }

  addAssigned(name: string, value: number) {
    this.addValue(name, value, SymbolType.assigned)
  }

  addLabel(name: string, value: number) {
    this.addValue(name, value, SymbolType.label)
  }
}



