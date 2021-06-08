import { MachineState } from "../../src/emulator/machine_state"

test(`Registers start with zero`, () => {
  const reg = new MachineState().registers
  let i 
  for (i = 0; i < 8; i++) {
    expect(reg[i]).toBe(0)
  }
})

test(`Registers remember values`, () => {
  const reg = new MachineState().registers
  let i 
  for (i = 0; i < 8; i++) {
    reg[i] = i * 123
  }
  for (i = 7; i >= 0; i--) {
    expect(reg[i]).toBe(i *123)
  }
})

// test(`Register numbers are checked`, () => {
//   const reg = new MachineState().registers

//   for (let i = -1; i < 9; i++) {
//     if (i < 0 || i > 7) {
//       expect(() => reg[i] = 1).toThrow()
//       expect(() => reg[i]).toThrow()
//     }
//     else {
//       reg[i] = i
//       expect(reg[i]).toBe(i)
//     }
//   }
// })

test(`Registers accept correct range of values`, () => {
  const reg = new MachineState().registers
  reg[0] = 0xffff
  expect(reg[0]).toBe(0xffff)
  reg[0] = 0
  expect(reg[0]).toBe(0)
  expect(() => reg[0] = 0x10000).toThrow()
})


// memory/psw

function testFlags(psw, [ N, Z, V, C ]) {
  expect(psw.N).toBe(N)
  expect(psw.Z).toBe(Z)
  expect(psw.V).toBe(V)
  expect(psw.C).toBe(C)
}

test(`psw flags are initialized clear`, () => {
  const psw = new MachineState().memory.psw

  testFlags(psw, [ false, false, false, false ])
})

test(`setting psw flags doesn't affect other flags`, () => {
  const psw = new MachineState().memory.psw

  for (let n of [true, false]) {
    psw.N = n
    for (let z of [true, false]) {
      psw.Z = z
      for (let v of [true, false]) {
        psw.V = v
        for (let c of [true, false]) {
          psw.C = c
          testFlags(psw, [ n, z, v, c ])
        }
      }
    }
  }
})

// memory

test(`memory is initialized to zero`, () => {
  const mem = new MachineState().memory
  for (let i = 0; i < 0x10000; i += 1234) {
    expect(mem.getByte(i)).toBe(0)
    expect(mem.getWord(i)).toBe(0)
  }
})

test(`memory can be set and read (bytes)`, () => {
  const mem = new MachineState().memory
  for (let i = 0; i < 0x10000; i += 1234) {
    let v = i & 0xff
    mem.setByte(i, v)
    expect(mem.getByte(i)).toBe(v)
  }
})

test(`memory can be set and read (words)`, () => {
  const mem = new MachineState().memory
  for (let i = 0; i < 0x10000; i += 1234) {
    mem.setWord(i, i)
    expect(mem.getWord(i)).toBe(i)
  }
})

test(`memory byte order`, () => {
  const mem = new MachineState().memory
  mem.setWord(100, 0x2345)
  expect(mem.getByte(100)).toBe(0x45)
  expect(mem.getByte(101)).toBe(0x23)
})


