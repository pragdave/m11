import { assembleAndRun, octal } from "../../helpers"

test(`jsr/rts (PC)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          jsr   pc, subr
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  const initialSP = r[6]

  do
    [ r, m, psw ] = runner.step();
  while (r[0] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[6]).toBe(initialSP - 2)
  expect(m.w(r[6])).toBe(runner.symbol(`retadr`).value)

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[1]).toBe(1)
  expect(r[6]).toBe(initialSP)
  expect(m.w(r[6]-2)).toBe(runner.symbol(`retadr`).value)
})


test(`jsr/rts (R5)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #555, r5
          jsr   r5, subr
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r5
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  const initialSP = r[6]

  do
    [ r, m, psw ] = runner.step();
  while (r[0] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[5]).toBe(runner.symbol(`retadr`).value)
  expect(r[6]).toBe(initialSP - 2)
  expect(m.w(r[6])).toBe(0o555)

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[1]).toBe(1)
  expect(r[5]).toBe(0o555)
  expect(r[6]).toBe(initialSP)
})

test(`jsr/rts addr in register`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #subr, r4
          jsr   pc, r4
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  const initialSP = r[6]

  do
    [ r, m, psw ] = runner.step();
  while (r[0] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[6]).toBe(initialSP - 2)
  expect(m.w(r[6])).toBe(runner.symbol(`retadr`).value)

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[1]).toBe(1)
  expect(r[6]).toBe(initialSP)
  expect(m.w(r[6]-2)).toBe(runner.symbol(`retadr`).value)
})


