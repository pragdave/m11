import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  ccc
        mov   #1, r0
        ror   r0
        ror   r0
        ror   r0

        mov   #-1, r0
        rorb  r0
        rorb  r0
        clrb  r0
        rorb  r0
        ccc
        sec
        rorb  r0
        .end  start
`

test(`basic ror`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•ZVC` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100000, `N•V•` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o040000, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177577, `••VC` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177677, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177400, `•Z••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177600, `N•V•` ]);

})

