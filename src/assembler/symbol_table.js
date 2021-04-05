import { otherError } from "./util.js"

const SymbolType = {
  undefined: 0,
  label: 1,
  assigned: 2,
}

class Symbol {

  constructor(name, value, type) {
    this.name = name
    this.value = value
    this.type = type
  }

  isDefined() {
    return this.type !== SymbolType.undefined
  }
}

export class SymbolTable {
  constructor() {
    this.symbols = {}
  }

  lookup(name) {
    return this.symbols[name]
  }

  getValueOf(name) {
    const sym = this.lookup(name)
    if (sym)
      return sym.value
    else
      return undefined
  }

  setValueOf(name, value) {
    const sym = this.lookup(name)
    if (sym)
      sym.value = value
    else
      otherError(`attempt to update nonexistent symbol "${name}"`)
  }

  addValue(name, value, type) {
    if (name !== `.` && name in this.symbols) {
      if (this.symbols[name].value !== value) {
        otherError(`Symbol "${name}" has multiple values (maybe a duplicate definition?)`)
      }
    }
    else {
      this.symbols[name] = new Symbol(name, value, type)
    }
  }

  addAssigned(name, value) {
    this.addValue(name, value, SymbolType.assigned)
  }

  addLabel(name, value) {
    this.addValue(name, value, SymbolType.label)
  }
}



