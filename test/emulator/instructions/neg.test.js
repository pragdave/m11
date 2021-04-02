import { assembleAndRun } from "../../helpers" 

const t1 = `
zero:   .word 0
p1:     .word 1
m1:     .word -1
maxn:   .word 100000


start:  mov   zero, r0
        neg   r0
        mov   p1, r0
        neg   r0
        mov   m1, r0
        neg   r0
        mov   maxn, r0
        neg   r0

        neg   zero
        neg   p1
        neg   m1
        neg   maxn
        .end  start
`

test(`basic neg`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, `N••C`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 1, `•••C`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100000, `N•VC`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 0, `•Z••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`p1`), psw ]).toEqual([ 0o177777, `N••C`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`m1`), psw ]).toEqual([ 1, `•••C`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxn`), psw ]).toEqual([ 0o100000, `N•VC`]);
})

const t2 = `
zero:   .word 023400
p1:     .word 023401
m1:     .word 023377
maxn:   .word 023200


start:  mov   zero, r0
        negb  r0
        mov   p1, r0
        negb  r0
        mov   m1, r0
        negb  r0
        mov   maxn, r0
        negb  r0

        negb  zero
        negb  p1
        negb  m1
        negb  maxn
        .end  start
`

test(`basic negb`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o023400, `•Z••`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o023777, `N••C`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o023001, `•••C`]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o023200, `N•VC`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`zero`), psw ]).toEqual([ 0o023400, `•Z••`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`p1`), psw ]).toEqual([ 0o023777, `N••C`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`m1`), psw ]).toEqual([ 0o023001, `•••C`]);

  [ r, m, psw ] = runner.step();
  expect([ m.w(`maxn`), psw ]).toEqual([ 0o023200, `N•VC`]);
})
