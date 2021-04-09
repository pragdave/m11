import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  cmp   #1, #1
        cmp   #1, #2
        cmp   #2, #1

        cmp   #100000,#0
        cmp   #0, #100000
        cmp   #177776, #177777
        cmp   #177777, #177776
        .end  start
`

test(`basic cmp (word)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();   // cmp #1, #1
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();   // cmp #1, #2
  expect(psw).toEqual(`N••C`);

  [ r, m, psw ] = runner.step();   // cmp #2, #1
  expect(psw).toEqual(`••••`);


  [ r, m, psw ] = runner.step();   // cmp #100000, #0
  expect(psw).toEqual(`N•••`);

  [ r, m, psw ] = runner.step();   // cmp #0, #100000
  expect(psw).toEqual(`N•VC`);

  [ r, m, psw ] = runner.step();   // cmp #177776, #177777
  expect(psw).toEqual(`N••C`);

  [ r, m, psw ] = runner.step();   // cmp #177777, #177776
  expect(psw).toEqual(`••••`);
})


