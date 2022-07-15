/* eslint-disable max-len */

export const Operators = {

  // 15			12	11		9	8		6	5		3	2		0
  // Opcode	Src	Register	Dest	Register

  mov:  { fmt: `TwoOp1`, op: 0o010000, desc: `Move: Dest ← Src` },
  movb: { fmt: `TwoOp1`, op: 0o110000, desc: `Move: Dest ← Src` },
  cmp:  { fmt: `TwoOp1`, op: 0o020000, desc: `Compare: Set-flags(Src − Dest)` },
  cmpb: { fmt: `TwoOp1`, op: 0o120000, desc: `Compare: Set-flags(Src − Dest)` },
  bit:  { fmt: `TwoOp1`, op: 0o030000, desc: `Bit test: Set-flags(Src ∧ Dest)` },
  bitb: { fmt: `TwoOp1`, op: 0o130000, desc: `Bit test: Set-flags(Src ∧ Dest)` },
  bic:  { fmt: `TwoOp1`, op: 0o040000, desc: `Bit clear: Dest ← Dest ∧ Ones-complement(Src)` },
  bicb: { fmt: `TwoOp1`, op: 0o140000, desc: `Bit clear: Dest ← Dest ∧ Ones-complement(Src)` },
  bis:  { fmt: `TwoOp1`, op: 0o050000, desc: `Bit set: Dest ← Dest ∨ Src` },
  bisb: { fmt: `TwoOp1`, op: 0o150000, desc: `Bit set: Dest ← Dest ∨ Src` },
  add:  { fmt: `TwoOp1`, op: 0o060000, desc: `Add: Dest ← Dest + Src` },
  sub:  { fmt: `TwoOp1`, op: 0o160000, desc: `Subtract: Dest ← Dest − Src` },


  // 15						9	8		6	5		3	2		0
  // Opcode	Reg	Src/Dest	Register


  mul:  { fmt: `TwoOp2`, op: 0o070000, desc: `Multiply: (Reg, Reg+1) ← Reg × Src` },
  div:  { fmt: `TwoOp2`, op: 0o071000, desc: `Divide: Compute (Reg, Reg+1) ÷ Src; Reg ← quotient; Reg+1 ← remainder` },
  ash:  { fmt: `TwoOp2`, op: 0o072000, desc: `Arithmetic shift: if Src<5:0> < 0 then Reg ← Shift-right(Reg, -Src<5:0>) else Reg ← Shift-left(Reg, Src<5:0>)` },
  ashc: { fmt: `TwoOp2`, op: 0o073000, desc: `Arithmetic shift combined: if Src<5:0> < 0 then (Reg, Reg+1) ← Shift-right((Reg, Reg+1), -Src<5:0>) else (Reg, Reg+1) ← Shift-left((Reg, Reg+1), Src<5:0>)` },

  xor:  { fmt: `TwoOp3`, op: 0o074000, desc: `Exclusive or: Dest ← Dest ⊻ Reg` },

  // 15									6	5		3	2		0
  // Opcode	Src/Dest	Register

  jmp:  { op: 0o000100, fmt: `OneOp`, desc: `Jump: PC ← Src` },
  swab: { op: 0o000300, fmt: `OneOp`, desc: `Swap bytes of word: Dest ← Swap-bytes(Dest)` },
  clr:  { op: 0o005000, fmt: `OneOp`, desc: `Clear: Dest ← 0` },
  clrb: { op: 0o105000, fmt: `OneOp`, desc: `Clear: Dest ← 0` },
  com:  { op: 0o005100, fmt: `OneOp`, desc: `Complement: Dest ← Ones-complement(Dest)` },
  comb: { op: 0o105100, fmt: `OneOp`, desc: `Complement: Dest ← Ones-complement(Dest)` },
  inc:  { op: 0o005200, fmt: `OneOp`, desc: `Increment: Dest ← Dest + 1` },
  incb: { op: 0o105200, fmt: `OneOp`, desc: `Increment: Dest ← Dest + 1` },
  dec:  { op: 0o005300, fmt: `OneOp`, desc: `Decrement: Dest ← Dest − 1` },
  decb: { op: 0o105300, fmt: `OneOp`, desc: `Decrement: Dest ← Dest − 1` },
  neg:  { op: 0o005400, fmt: `OneOp`, desc: `Negate: Dest ← Twos-complement(Dest)` },
  negb: { op: 0o105400, fmt: `OneOp`, desc: `Negate: Dest ← Twos-complement(Dest)` },
  adc:  { op: 0o005500, fmt: `OneOp`, desc: `Add carry: Dest ← Dest + C flag` },
  adcb: { op: 0o105500, fmt: `OneOp`, desc: `Add carry: Dest ← Dest + C flag` },
  sbc:  { op: 0o005600, fmt: `OneOp`, desc: `Subtract carry: Dest ← Dest - C flag` },
  sbcb: { op: 0o105600, fmt: `OneOp`, desc: `Subtract carry: Dest ← Dest - C flag` },
  tst:  { op: 0o005700, fmt: `OneOp`, desc: `Test: Set-flags(Src)` },
  tstb: { op: 0o105700, fmt: `OneOp`, desc: `Test: Set-flags(Src)` },
  ror:  { op: 0o006000, fmt: `OneOp`, desc: `Rotate right: Dest ← Rotate-right(Dest, 1)` },
  rorb: { op: 0o106000, fmt: `OneOp`, desc: `Rotate right: Dest ← Rotate-right(Dest, 1)` },
  rol:  { op: 0o006100, fmt: `OneOp`, desc: `Rotate left: Dest ← Rotate-left(Dest, 1)` },
  rolb: { op: 0o106100, fmt: `OneOp`, desc: `Rotate left: Dest ← Rotate-left(Dest, 1)` },
  asr:  { op: 0o006200, fmt: `OneOp`, desc: `Arithmetic shift right: Dest ← Shift-right(Dest, 1)` },
  asrb: { op: 0o106200, fmt: `OneOp`, desc: `Arithmetic shift right: Dest ← Shift-right(Dest, 1)` },
  asl:  { op: 0o006300, fmt: `OneOp`, desc: `Arithmetic shift left: Dest ← Shift-left(Dest, 1)` },
  aslb: { op: 0o106300, fmt: `OneOp`, desc: `Arithmetic shift left: Dest ← Shift-left(Dest, 1)` },
  mtps: { op: 0o106400, fmt: `OneOp`, desc: `Move to PSW: PSW ← Src` },
  mfpi: { op: 0o006500, fmt: `OneOp`, desc: `Move from previous I space: −(SP) ← Src` },
  mfpd: { op: 0o106500, fmt: `OneOp`, desc: `Move from previous D space: −(SP) ← Src` },
  mtpi: { op: 0o006600, fmt: `OneOp`, desc: `Move to previous I space: Dest ← (SP)+` },
  mtpd: { op: 0o106600, fmt: `OneOp`, desc: `Move to previous D space: Dest ← (SP)+` },
  sxt:  { op: 0o006700, fmt: `OneOp`, desc: `Sign extend: if N flag ≠ 0 then Dest ← -1 else Dest ← 0` },
  mfps: { op: 0o106700, fmt: `OneOp`, desc: `Move from PSW: Dest ← PSW` },



  // 15						9	8	7							0
  // Opcode	C	Offset

  br:   { op: 0o000400, fmt: `Branch`, desc: `Branch always PC ← PC + 2 × Sign-extend(Offset)` },
  bne:  { op: 0o001000, fmt: `Branch`, desc: `Branch if not equal Z = 0` },
  beq:  { op: 0o001400, fmt: `Branch`, desc: `Branch if equal Z = 1` },
  bge:  { op: 0o002000, fmt: `Branch`, desc: `Branch if greater than or equal (N ⊻ V) = 0` },
  blt:  { op: 0o002400, fmt: `Branch`, desc: `Branch if less than (N ⊻ V) = 1` },
  bgt:  { op: 0o003000, fmt: `Branch`, desc: `Branch if greater than (Z ∨ (N ⊻ V)) = 0` },
  ble:  { op: 0o003400, fmt: `Branch`, desc: `Branch if less than or equal (Z ∨ (N ⊻ V)) = 1` },
  bpl:  { op: 0o100000, fmt: `Branch`, desc: `Branch if plus N = 0` },
  bmi:  { op: 0o100400, fmt: `Branch`, desc: `Branch if minus N = 1` },
  bhi:  { op: 0o101000, fmt: `Branch`, desc: `Branch if higher (C ∨ Z) = 0` },
  blos: { op: 0o101400, fmt: `Branch`, desc: `Branch if lower or same (C ∨ Z) = 1` },
  bvc:  { op: 0o102000, fmt: `Branch`, desc: `Branch if overflow clear V = 0` },
  bvs:  { op: 0o102400, fmt: `Branch`, desc: `Branch if overflow set V = 1` },
  bcc:  { op: 0o103000, fmt: `Branch`, desc: `Branch if carry clear, or Branch if higher or same C = 0` },
  bhis: { op: 0o103000, fmt: `Branch`, desc: `Branch if carry clear, or Branch if higher or same C = 0` },
  bcs:  { op: 0o103400, fmt: `Branch`, desc: `Branch if carry set, or Branch if lower C = 1` },
  blo:  { op: 0o103400, fmt: `Branch`, desc: `Branch if carry set, or Branch if lower C = 1` },


  // 15						9	8		6	5					0
  // Opcode	Reg	Offset
  sob:   { op: 0o077000, fmt: `Sob`, desc:	`SOB	Subtract One and Branch: Reg ← Reg - 1; if Reg ≠ 0 then PC ← PC - 2 × Offset` },

  // 15						9	8		6	5		3	2		0
  // Opcode	Reg	Src	Register

  jsr:  { op: 0o004000, fmt: `TwoOp3`, desc: `Jump to subroutine: -(SP) ← Reg; Reg ← PC; PC ← Src` },

  // 15												3	2		0
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
  `.print`,
  `.ttyout`,
  `.word`,
]

export const Registers = { 
  r0: 0, r1: 1, r2: 2, r3: 3, r4: 4, r5: 5, r6: 6, r7: 7, sp: 6, pc: 7, 
}


