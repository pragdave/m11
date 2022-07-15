import { octal } from "./util"

export const MemInstruction = 1
export const MemOperand     = 2
export const MemData        = 4
export const MemFillData    = 4

export class Memory {

  memory: number[]

  constructor() {
    this.memory = []
  }
  getByte(addr: number) {
    return this.memory[addr]
  }
  setByte(addr: number, value: number) {
    this.memory[addr] = value
  }

  getWord(addr: number) {
    return (this.memory[addr + 1] << 8 + this.memory[addr])
  }

  setWord(addr: number, value: number) {
    this.memory[addr] = value & 0xff
    this.memory[addr + 1] = value >> 8
  }

  toString() {
    const result = []
    for (let i = 0; i < this.memory.length; i += 2) {
      if (this.memory[i] !== undefined || this.memory[i + 1] !== undefined) {
        result.push(`${octal(i)}: ${octal(this.memory[i + 1] << 8 | this.memory[i])}`)
      }
    }
    return result.join(`\n`)
  }
}


