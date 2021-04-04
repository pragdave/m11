import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  clr   r0
        add   #1, r0
        add   #77776, r0
        add   #1, r0

        mov   #100000, r0
        add   #-1, r0

        mov   #140000, r0
        add   #040000, r0

        mov   #140000, r0
        add   #100000, r0
        .end  start
`

test(`basic add`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000001, `••••` ]);  // 0 + 1

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077777, `••••` ]);  // 1 + 0o077776

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100000, `N•V•` ]);  // 0o077777 + 1

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077777, `••VC` ]);  // 0o100000 + 0o177777

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•Z•C` ]);  // 0o140000 + 0o040000

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o040000, `••VC` ]);  // 0o140000 + 0o140000

})


