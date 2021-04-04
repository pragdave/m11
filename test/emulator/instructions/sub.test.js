import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #2, r0
        sub   #1, r0
        sub   #1, r0
        sub   #1, r0
        sub   #1, r0
        .end  start
`

test(`basic sub`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000001, `••••` ]);  // 2-1

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•Z••` ]);  // 1-1

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N••C` ]);  // 0-1

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177776, `N•••` ]);  // -1-1


})



