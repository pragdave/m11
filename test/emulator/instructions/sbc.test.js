import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  ccc
        clr   r0
        sbc   r0

        sec
        sbc   r0

        mov  #100000, r0
        sec
        sbc  r0

        mov  #1, r0
        sec
        sbc  r0

        .end  start
`

test(`basic sbc`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•Z••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077777, `••VC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000000, `•Z•C` ]);

})

const t2 = `
start:  mov   #123000, r0
        ccc
        sbcb  r0

        sec
        sbcb  r0

        mov  #100200, r0
        sec
        sbcb r0

        mov  #123001, r0
        sec
        sbcb r0

        .end  start
`

test(`basic sbcb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123000, `•Z••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123377, `N•••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100177, `••VC` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123000, `•Z•C` ]);

})


