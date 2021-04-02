import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #010203, r0
        asr   r0
        mov   #010202, r0
        asr   r0
        mov   #123456, r0
        asr   r0
        mov   #177777, r0
        asr   r0
        mov   #1, r0
        asr   r0
        .end  start
`

test(`basic tst`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o004101, `••VC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o004101, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o151627, `N•V•` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•ZVC` ]);
})

const t2 = `
start:  mov   #010103, r0
        asrb  r0
        mov   #010202, r0
        asrb  r0
        mov   #123456, r0
        asrb  r0
        mov   #177777, r0
        asrb  r0
        mov   #1001, r0
        asrb  r0
        .end  start
`

test(`basic tst`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o010041, `••VC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o010301, `N•V•` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123427, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o001000, `•ZVC` ]);
})

