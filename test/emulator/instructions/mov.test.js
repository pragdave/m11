import { assembleAndRun } from "../../helpers" 

const t1 = `
m1:   .word 0

start:  mov   #123, r0
        mov   r0, r1
        mov   r1, m1
        .end  start
`

test(`basic mov`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o123, `••••`]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], psw ]).toEqual([ 0o123, 0o123, `••••`]);
  [ r, m, psw ] = runner.step();
  expect([ m.w("m1"), psw ]).toEqual([ 0o123, `••••`]);

})


const t2 = `
start:  mov   #000000, r0
        mov   #177777, r0
        mov   #100000, r0
        mov   #000001, r0
        mov   #077777, r0
        .end  start
`

test(`condition codes`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw;

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([        0, "•Z••"]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177777, "N•••"]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o100000, "N•••"]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([        1, "••••"]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([    32767, "••••"]);
})

const t3 = `
start:  mov   #177777, r0
        movb  #123, r0
        mov   #0, r0
        movb  #307, r0
        .end  start
`

test(`movb sign extends into registers`, () => {
  const runner = assembleAndRun(t3)
  let r, m, psw;

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([    0o123, "••••"]);
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toEqual([ 0o177707, "N•••"]);
})

const t4 = `
target: .word 0

start:  movb  #123, target
        mov   #0, target
        movb  #123, target+1
        mov   #0, target
        movb  #307, target
        mov   #0, target
        movb  #307, target+1
        .end  start
`

test(`movb doesn't sign extend into memory`, () => {
  const runner = assembleAndRun(t4)
  let r, m, psw;

  [ r, m, psw ] = runner.step();
  expect(m.w(`target`)).toBe(0o123);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(m.w(`target`)).toEqual(0o123 << 8);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(m.w(`target`)).toEqual(0o000307);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(m.w(`target`)).toEqual(0o307 << 8)
})

