import { assembleAndRun } from "../../helpers" 

const t1 = `
zero:   .word 0
p1:     .word 1
maxn:   .word 100000
maxp:   .word 077777


start:  dec   zero
        dec   p1
        dec   maxn
        dec   maxp

        mov   #0, r0
        dec   r0
        mov   #1, r0
        dec   r0
        mov   #100000, r0
        dec   r0
        mov   #077777, r0
        dec   r0
        .end  start
`

test(`basic dec`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`p1`), psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxn`), psw ]).toEqual([ 0o077777, `••V•`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxp`), psw ]).toEqual([ 0o077776, `••••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077777, `••V•`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077776, `••••`]);

})


const t2 = `
zero:   .word 177400
p1:     .word 177401
maxn:   .word 077600
maxp:   .word 077577

start:  decb   zero
        decb   p1
        decb   maxn
        decb   maxp

        mov   #177400, r0
        decb   r0
        mov   #177401, r0
        decb   r0
        mov   #077600, r0
        decb   r0
        mov   #077577, r0
        decb   r0
        .end  start
`

test(`basic decb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step(); // decb   m1
  expect([ m.w(`p1`), psw ]).toEqual([ 0o177400, `•Z••`]);

  [ r, m, psw ] = runner.step();  // decb maxn
  expect([ m.w(`maxn`), psw ]).toEqual([ 0o077577, `••V•`]);

  [ r, m, psw ] = runner.step();  // decb maxp
  expect([ m.w(`maxp`), psw ]).toEqual([ 0o077576, `••••`]);

  [ r, m, psw ] = runner.step();  // #0
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step();  // 0o177777 
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177400, `•Z••`]);

  [ r, m, psw ] = runner.step();    
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077577, `••V•`]);

  [ r, m, psw ] = runner.step(); // 0o077577
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o077576, `••••`]);
})


