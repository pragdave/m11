class SourceLine {
  // comment
  constructor(info) {
    this.type = this.constructor.name
    this.comment = info.comment
  }
}

class BlankLine extends SourceLine {
}

class AssignmentLine extends SourceLine {
  constructor(info) {
    super(info)
    this.symbol = info.symbol
    this.rhs = info.rhs
    this.value = info.value
  }
}

class JustLabelsLine extends SourceLine {
  constructor(info) {
    super(info)
    this.labels = info.labels
    this.address = info.address
  }
}

class CodegenLine extends JustLabelsLine {
  constructor(info) {
    super(info)
    this.opcode = info.opcode
    this.rhs = info.rhs
    this.generatedBytes = info.generatedBytes
  }
}

export class SourceCode {
  constructor(original_code) {
    this.original_code = original_code
    this.reset()
  }

  reset() {
    this.sourceLines = []
    this.start_address = 0o1000
  }

  createAndAddLine(info) {
    let line

    switch (info.type) {
      case `AssignmentLine`:
        line = new AssignmentLine(info)
        break

      case `BlankLine`:
        line = new BlankLine(info)
        break

      case `DirectiveLine`:
      case `OpcodeLine`:
        line = new CodegenLine(info)
        break

      case `JustLabels`:
        line = new JustLabelsLine(info)
        break

      default:
        throw new Error(`unhandled line type ${info.type}`)
    }

    this.sourceLines.push(line)
  }

  toMemory() { // return list of [ address, [ bytes ]]
    return this.sourceLines.map(sl => [ sl.address, sl.generatedBytes ])
  }
}


