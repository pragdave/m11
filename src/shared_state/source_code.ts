import { LexToken } from "../assembler/lexer"

export interface ISourceLine {
  type: LineType
  comment?: string
  line: number
  height_in_lines: number
}

export interface IBlankLine extends ISourceLine {
  type: LineType.BlankLine
  height_in_lines: 1
}
export interface IErrorLine extends ISourceLine {
  type: LineType.ErrorLine
  message: string
  lineText: string
  col: number
  symType: string
  symText: string
  height_in_lines: 1
}

export interface IAssignmentLine extends ISourceLine {
  type: LineType.AssignmentLine
  symbol: string
  value: any
  rhs:   LexToken[]
  height_in_lines: 1
}

// interface IJustLabelsLine extends ISourceLine {
//   type: `JustLabelsLine`
//   address: number
//   labels: string[]
// }

export interface ICodegenLine extends SourceLine {
  type: LineType.CodegenLine
  address: number
  labels: string[]
  opcode: string
  rhs: LexToken[]
  generatedBytes: number[]
}

export type RawLineInfo = IBlankLine | IAssignmentLine | ICodegenLine | IErrorLine

////////////////////////////////////////////////////////////////////////////////

export enum LineType {
  AssignmentLine = "AssignmentLine",
  BlankLine      = "BlankLine",
  CodegenLine    = "CodegenLine",
  ErrorLine      = "ErrorLine"
}

export abstract class SourceLine {
  type: LineType
  comment: string
  line: number
  height_in_lines = 1

  // comment
  constructor(info: ISourceLine) {
    // this.type = this.constructor.name
    this.comment = info.comment
    this.line = info.line
  }
}

export class BlankLine extends SourceLine {
  type = LineType.BlankLine


}

export class ErrorLine extends SourceLine {
  type = LineType.ErrorLine
  message: string
  lineText: string
  col: number
  symType: string
  symText: string

  constructor(info: IErrorLine) {
    super(info)
    this.message = info.message
    this.lineText = info.lineText
    this.col = info.col
    this.symType = info.symType
    this.symText = info.symText
  }
}

export class AssignmentLine extends SourceLine {
  type = LineType.AssignmentLine
  symbol: string
  value: any
  rhs:   LexToken[]

  constructor(info: IAssignmentLine) {
    super(info)
    this.symbol = info.symbol
    this.rhs = info.rhs
    this.value = info.value
  }
}



// class JustLabelsLine extends SourceLine {
//   address: number
//   labels: string[]

//   constructor(info: IJustLabelsLine) {
//     super(info)
//     this.labels = info.labels
//     this.address = info.address
//   }
// }

function calculate_height(addr: number, bytes: number[]) {
  let len = bytes.length
  if (addr & 1)
    len++
  if (len & 1)
    len++

  return Math.ceil((len+2)/6)
}

export class CodegenLine extends SourceLine {
  type = LineType.CodegenLine
  address: number
  labels: string[]
  opcode: string
  rhs: LexToken[]
  generatedBytes: number[]

  constructor(info: ICodegenLine) {
    super(info)
    this.labels = info.labels
    this.address = info.address
    this.opcode = info.opcode
    this.rhs = info.rhs
    this.generatedBytes = info.generatedBytes
    this.height_in_lines = calculate_height(this.address, this.generatedBytes)
  }
}

export type AssembledLine = BlankLine | AssignmentLine | ErrorLine | CodegenLine

////////////////////////////////////////////////////////////////////////////////

export class SourceCode {
  original_code: string
  sourceLines:  AssembledLine[]
  start_address: number
  unresolvedNames: Record<string, any>
  errorCount: number

  constructor(original_code: string) {
    this.original_code = original_code
    this.reset()
  }

  reset() {
    this.sourceLines = []
    this.start_address = 0o1000
    this.unresolvedNames = {}
    this.errorCount = 0
  }

  createAndAddLine(info: RawLineInfo) {
    let line: AssembledLine

    switch (info.type) {
      case LineType.AssignmentLine:
        line = new AssignmentLine(info)
        break

      case LineType.BlankLine:
        line = new BlankLine(info)
        break

      case LineType.CodegenLine:
        line = new CodegenLine(info)
        break

      case LineType.ErrorLine:
        line = new ErrorLine(info)
        this.errorCount++
        break

      default:
        throw new Error(`unhandled line type ${info}`)
    }

    this.sourceLines.push(line)
  }

  recordUnresolvedNames(namesAndLines: Record<string, any>) {
    this.unresolvedNames = namesAndLines
    this.errorCount += Object.keys(namesAndLines).length
  }

  toMemory(): [ number, number[]][] { // return list of [ address, [ bytes ]]
    const justCode =this
    .sourceLines
    .filter((sl: SourceLine) => sl instanceof CodegenLine) as CodegenLine[]


    return justCode.map((sl: CodegenLine) => [ sl.address, sl.generatedBytes ])
  }
}


