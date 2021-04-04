import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #2, r0
        mul   #3, r0

        mov   #6, r0
        mul   #040000, r0

        mov   #6, r1
        mov   #123, r2
        mul #040000, r1

        mov   #-2, r0
        mul   #3, r0

        mov   #4, r0
        mul   #-5, r0

        .end  start
`

test(`basic mul`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], psw ]).toEqual([ 0, 6, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(psw).toEqual( `•••C`);
  expect(( r[0] << 16) |  r[1]).toBe(6 * 0o040000);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(psw).toEqual( `•••C`);
  expect(r[1]).toBe((6 * 0o040000) & 0xffff);
  expect(r[2]).toBe(0o123);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(psw).toEqual( `N•••`);
  expect(r[0]).toBe(0o177777);
  expect(r[1]).toBe((-6) & 0xffff);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect(psw).toEqual( `N•••`);
  expect(r[0]).toBe(0o177777);
  expect(r[1]).toBe((-20) & 0xffff);
  
})

