import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #010203, r0
        asl   r0
        mov   #100001, r0
        asl   r0
        mov   #100000, r0
        asl   r0
        mov   #177777, r0
        asl   r0
        mov   #1, r0
        asl   r0
        .end  start
`

test(`basic asl`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o020406, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000002, `••VC` ]);

  [ r, m, psw ] = runner.step();
  debugger
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•ZVC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177776, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000002, `••••` ]);
})

const t2 = `
start:  mov   #010103, r0
        aslb  r0
        mov   #010202, r0
        aslb  r0
        mov   #123456, r0
        aslb  r0
        mov   #177777, r0
        aslb  r0
        mov   #1200, r0
        aslb  r0
        .end  start
`

test(`basic aslb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o010206, `N•V•` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o010004, `••VC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123534, `••••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177776, `N••C` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o001000, `•ZVC` ]);
})

