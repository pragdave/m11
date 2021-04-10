import { assembleAndRun, octal } from "../../helpers"

test(`jsr/rts (smoke)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          jsr   pc, subr
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  common(t1)
})


test(`jsr/rts (mode 1)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #subr, r2
          jsr   pc, (r2)
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  common(t1)
})


test(`jsr/rts (mode 2)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #subr, r2
          jsr   pc, (r2)+
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  let [ r, m, psw, symbol ] = common(t1)
  expect(r[2]).toBe(symbol(`subr`) + 2)
})


test(`jsr/rts (mode 3)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #$subr, r2
          jsr   pc, @(r2)+
  retadr: mov   #1, r1

  $subr:  .word subr
  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  let [ r, m, psw, symbol ] = common(t1)
  expect(r[2]).toBe(symbol(`subr`))
})


test(`jsr/rts (mode 4)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #subr+2, r2
          jsr   pc, -(r2)
  retadr: mov   #1, r1

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  let [ r, m, psw, symbol ] = common(t1)
  expect(r[2]).toBe(symbol(`subr`))
})

test(`jsr/rts (mode 5)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #subr, r2
          jsr   pc, @-(r2)
  retadr: mov   #1, r1

          .word subr

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  common(t1)
})

test(`jsr/rts (mode 6)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #base, r2
          jsr   pc, 4(r2)
  retadr: mov   #1, r1

  base:   dec   r1
          dec   r1
  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  common(t1)
})

test(`jsr/rts (mode 7)`, () => {

  const t1 = `
  start:  clr   r0
          clr   r1
          mov   #base, r2
          jsr   pc, @4(r2)
  retadr: mov   #1, r1

  base:   .word  0
          .word 1234
          .word subr

  subr:   mov   #1234, r0
          rts   r7
          .end  start
  `
  common(t1)
})


function common(src) {
  const runner = assembleAndRun(src)
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

  return [ r, m, psw, (name) => runner.symbol(name).value ]
}

