import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  ccc
        mov   #100000, r0
        rol   r0
        rol   r0
        sec
        rol   r0

        mov   #-1, r0
        rolb  r0
        rolb  r0
        clrb  r0
        rolb  r0
        ccc
        sec
        rolb  r0
        .end  start
`

test(`basic rol`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•ZVC` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000001, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000003, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177776, `N••C` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177775, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177400, `•Z••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177401, `••••` ]);

})

