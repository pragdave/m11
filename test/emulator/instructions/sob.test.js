import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #4, r0
        clr   r2

loop:   inc   r2
        sob   r0, loop

        inc   r1
        .end  start
`

test(`sob`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  do 
    [ r, m, psw ] = runner.step();   // cmp #1, #1
  while (r[1] === 0) 

  expect(r[0]).toEqual(0);
  expect(r[2]).toEqual(4);
})



