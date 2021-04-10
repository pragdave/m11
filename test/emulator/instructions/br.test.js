import { assembleAndRun } from "../../helpers" 

const t1 = `
b2:     inc   r0
        halt
        .blkw 124  ; makes overall branch -128
b1:     inc   r0
        br    b2

start:  clr   r0
        br    b1
        .end  start
`

test(`br backwards`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`b1`).value);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`b2`).value);

  [ r, m, psw ] = runner.step();
  expect(r[0]).toBe(2);
})



const t2 = `
start:  clr   r0
        br    b1
        dec r0

b1:     inc   r0
        br    b2
        dec r0

b2:     inc   r0
        halt
        .end  start
`

test(`br forwards`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`b1`).value);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`b2`).value);

  [ r, m, psw ] = runner.step();
  expect(r[0]).toBe(2);
})





