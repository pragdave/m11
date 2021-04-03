import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #123456, r0
        sxt   r0

        ccc
        sxt   r0
        .end  start
`

test(`basic sxt`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•Z••` ]);
})

