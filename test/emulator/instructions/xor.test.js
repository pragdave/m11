import { assembleAndRun } from "../../helpers" 

const t1 = `
w1:     .word 052525
start:  mov   #177777, r1
        xor   r1, w1

        mov #123456, r2
        xor r2,r2

        .end  start
`

test(`basic xor`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ m.w(`w1`), r[1], psw ]).toEqual([ 0o125252, 0o177777, `N•••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[2], psw ]).toEqual([ 0o000000, `•Z••` ]);
})



