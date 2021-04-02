import { assembleAndRun } from "../../helpers" 

const t1 = `
zero:   .word 0
m1:     .word -1
maxp:   .word 077777
maxm1:  .word 177776
max:    .word 177777


m2:   .word -1
m3:   .word 0

start:  inc   zero
        inc   m1
        inc   maxp
        inc   maxm1
        inc   max

        mov   #0, r0
        inc   r0
        mov   #-1, r0
        inc   r0
        mov   #077777, r0
        inc   r0
        mov   #-2, r0
        inc   r0
        mov   #-1, r0
        inc   r0
        .end  start
`

test(`basic inc`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 1, `••••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`m1`), psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxp`), psw ]).toEqual([ 0o100000, `N•V•`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxm1`), psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 1, `••••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100000, `N•V•`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••`]);

})


const t2 = `
zero:   .word 177400
m1:     .word 177777
maxp:   .word 077577
maxm1:  .word 177776
max:    .word 000377


m2:   .word -1
m3:   .word 0

start:  incb   zero
        incb   m1
        incb   maxp
        incb   maxm1
        incb   max

        mov   #0, r0
        incb   r0
        mov   #-1, r0
        incb   r0
        mov   #077577, r0
        incb   r0
        mov   #-2, r0
        incb   r0
        .end  start
`

test(`basic incb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 0o177401, `••••`]);

  [ r, m, psw ] = runner.step(); // incb   m1
  expect([ m.w(`m1`), psw ]).toEqual([ 0o177400, `•Z••`]);

  [ r, m, psw ] = runner.step();  // incb maxp
  expect([ m.w(`maxp`), psw ]).toEqual([ 0o077600, `N•V•`]);

  [ r, m, psw ] = runner.step();  // incb maxm1
  expect([ m.w(`maxm1`), psw ]).toEqual([ 0o177777, `N•••`]);

  [ r, m, psw ] = runner.step(); // incb max
  expect([ m.w(`max`), psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();  // #0
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o000001, `••••`]);

  [ r, m, psw ] = runner.step();  // 0o177777 
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177400, `•Z••`]);

  [ r, m, psw ] = runner.step();  // 0o077577
  console.log("r0", r[0].toString(8));
  debugger
  [ r, m, psw ] = runner.step();
  console.log("r0", r[0].toString(8));

  expect([ r[0], psw ]).toEqual([ 0o077600, `N•V•`]);

  [ r, m, psw ] = runner.step();  // # -2
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N•••`]);
})


