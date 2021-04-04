import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #000000, r0
        mov   #20001, r1
        div   #2, r0

        mov   #000000, r0
        mov   #20001, r1
        div   #-2, r0

        div   #0, r0
        .end  start
`

test(`basic div`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], psw ]).toEqual([ 0o010000, 1, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], psw ]).toEqual([ 0o167777, 1, `N•••` ]);
  
  [ r, m, psw ] = runner.step();
  expect(psw.endsWith(`C`)).toBeTruthy()
})


