import { assembleAndRun } from "../../helpers" 

const t1 = `
m1:   .word 10101
m1a = m1+1 

m2:   .word -1
m3:   .word 0

start:  com   m1
        comb  m1
        mov   #013333, r0
        com   r0
        com   m2
        com   m3
        .end  start
`

test(`basic clr`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
 debugger 
  [ r, m, psw ] = runner.step();
  expect([ m.w(`m1`), psw ]).toEqual([ 0o167676, `N••C`]);

  [ r, m, psw ] = runner.step();
  expect([ m.b(`m1`), psw ]).toEqual([ 0o101, `•••C`]);
  expect(m.b(`m1a`)).toEqual(0o167400 >> 8);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o164444, `N••C`]);
  
  [ r, m, psw ] = runner.step();
  expect([ m.w(`m2`), psw ]).toEqual([ 0, `•Z•C`]);
  
  [ r, m, psw ] = runner.step();
  expect([ m.w(`m3`), psw ]).toEqual([ 0o177777, `N••C`]);
})


const t2 = `
m1:   .byte 101
m2:   .byte 101

start:  mov   m1, r3
        clrb  m1
        clrb  m1+1
        clrb   r3
        .end  start
`

test(`basic clrb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(m.b(`m1`)).toEqual(0o101);
  expect(m.b(`m2`)).toEqual(0o101);

  [ r, m, psw ] = runner.step();
  expect([ m.b(`m1`), psw ]).toEqual([ 0, `•Z••`]);
  expect(m.b(`m2`)).toEqual(0o101);

  [ r, m, psw ] = runner.step();
  expect([ m.b(`m2`), psw ]).toEqual([ 0, `•Z••`]);


  // TODO: should it clear the whole register?
  [ r, m, psw ] = runner.step();
  expect([ r[3], psw ]).toEqual([ 0o101 << 8, `•Z••`]);
})



