 // Opcode	Reg
  rts:  { op: 0o000200, fmt: `Rts`,   desc: `RTS	Return from subroutine: PC ← Reg; Reg ← (SP)+` },

  // 15						9	8	7							0
  // Opcode	S	Operation Code
  emt:  { op: 0o104000, fmt: `Trap`,  desc: `Emulator trap: -(SP) ← PS; -(SP) ← PC; PC ← (30); PS ← (32)` },
  trap: { op: 0o104400, fmt: `Trap`,  desc: `General trap: -(SP) ← PS; -(SP) ← PC; PC ← (34); PS ← (36)` },

  // 15															0
  // Opcode

  halt:  { op: 0o000000, fmt: `Opcode`, desc: `halt` },
  wait:  { op: 0o000001, fmt: `Opcode`, desc: `wait for interrupt` },
  rti:   { op: 0o000002, fmt: `Opcode`, desc: `Return from interrupt: PC ← (SP)+; PS ← (SP)+` },
  bpt:   { op: 0o000003, fmt: `Opcode`, desc: `Breakpoint trap: -(SP) ← PS; -(SP) ← PC; PC ← (14); PS ← (16)` },
  iot:   { op: 0o000004, fmt: `Opcode`, desc: `I/O trap: -(SP) ← PS; -(SP) ← PC; PC ← (20); PS ← (22)` },
  reset: { op: 0o000005, fmt: `Opcode`, desc: `reset external bus` },


  // 15                 6 5 4 3 2 1 0
  // Opcode               1 S N Z V C

  clc: { op: 0o000241, fmt: `Opcode`, desc: `clear C` },
  clv: { op: 0o000242, fmt: `Opcode`, desc: `clear V` },
  clz: { op: 0o000244, fmt: `Opcode`, desc: `clear Z` },
  cln: { op: 0o000250, fmt: `Opcode`, desc: `clear N` },
  sec: { op: 0o000261, fmt: `Opcode`, desc: `setC` },
  sev: { op: 0o000262, fmt: `Opcode`, desc: `set V` },
  sez: { op: 0o000264, fmt: `Opcode`, desc: `set Z` },
  sen: { op: 0o000270, fmt: `Opcode`, desc: `set N` },
  scc: { op: 0o000277, fmt: `Opcode`, desc: `set all CC's` },
  ccc: { op: 0o000257, fmt: `Opcode`, desc: `clear all CC's` },
  nop: { op: 0o000240, fmt: `Opcode`, desc: `no Operation` },

}

export const Opcodes = Object.keys(Operators)

export const Directives = [
  // `.ascii`,
  // `.asciiz`,
  // `.asciz`,
  `.blkb`,
  `.blkw`,
  `.byte`,
  `.end`,
  `.even`,
  `.odd`,
  `.word`,
]

export const Registers = { 
  r0: 0, r1: 1, r2: 2, r3: 3, r4: 4, r5: 5, r6: 6, r7: 7, sp: 6, pc: 7, 
}


const byFormat = {}

Object.keys(Operators).forEach(k => {
  const desc = Operators[k]
  const fmt = desc.fmt
  if (!(fmt in byFormat))
    byFormat[fmt] = []

  byFormat[fmt].push({ op: desc.op, inst: k }) 
})

Object.keys(byFormat).forEach(fmt => {
  let descs = byFormat[fmt]
  console.log(`\n${fmt}`)
  descs.forEach(({ op, inst }) => {
    console.log(op.toString(2).padStart(16, `0`), inst)
  })
})
