import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  clr   r0
        clr   r1
        jsr   pc, subr
retadr: mov   #1, r1

subr:   mov   #1234, r0
        rts   r7
        .end  start
`

test(`basic jsr/rts`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  do
    [ r, m, psw ] = runner.step();
  while (r[0] === 0)

  expect(r[0]).toBe(0o1234)
  expect(m.w(r[6])).toBe(runner.symbol(`retadr`))

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[0]).toBe(0o1234)
  expect(r[1]).toBe(1)
  expect(m.w(r[6]-2)).toBe(r.symbol(`retadr`))
})
