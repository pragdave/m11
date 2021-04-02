import { assembleAndRun } from "../../helpers" 

const t1 = `
m1:   .word 10101

start:  mov   m1, r3
        clr   m1
        clr   r3
        .end  start
`

test(`basic clr`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect([ r[3], psw ]).toEqual([ 0o10101, `••••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`m1`), psw ]).toEqual([ 0, `•Z••`]);
  [ r, m, psw ] = runner.step();
  expect([ r[3], psw ]).toEqual([ 0, `•Z••`]);
})


const t2 = `
m1:   .byte 101
m2:   .byte 102

start:  mov   m1, r3
        clrb  m1
        clrb  m1+1
        clrb   r3

        mov   #-1, r4
        clrb  r4
        .end  start
`

test(`basic clrb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(m.b(`m1`)).toEqual(0o101);
  expect(m.b(`m2`)).toEqual(0o102);

  [ r, m, psw ] = runner.step();
  expect([ m.b(`m1`), psw ]).toEqual([ 0, `•Z••`]);
  expect(m.b(`m2`)).toEqual(0o102);

  [ r, m, psw ] = runner.step();
  expect([ m.b(`m2`), psw ]).toEqual([ 0, `•Z••`]);


  [ r, m, psw ] = runner.step();
  expect([ r[3], psw ]).toEqual([ 0o102 << 8, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[4], psw ]).toEqual([ 0o177400, `•Z••`]);
})


