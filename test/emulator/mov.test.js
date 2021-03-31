import { assembleAndRun } from "../helpers" 

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


// const t2 = `
// start:  mov   #000000, r0
//         mov   #177777, r0
//         mov   #100000, r0
//         mov   #000001, r0
//         mov   #077777, r0
//         .end  start
// `

// test(`condition codes`, () => {
//   const runner = assembleAndRun(t1)
//   let r, m, psw

//   [ r, m, psw ] = runner.step()
//   expect([ r[0], psw ]).toEqual([      0, "•Z••"])
//   [ r, m, psw ] = runner.step()
//   expect([ r[0], psw ]).toEqual([     -1, "N•••"])
//   [ r, m, psw ] = runner.step()
//   expect([ r[0], psw ]).toEqual([ -32768, "N•••"])
//   [ r, m, psw ] = runner.step()
//   expect([ r[0], psw ]).toEqual([      1, "••••"])
//   [ r, m, psw ] = runner.step()
//   expect([ r[0], psw ]).toEqual([  32767, "••••"])
// })
