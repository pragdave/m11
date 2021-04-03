import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  scc
        ccc
        sen
        sez
        cln
        sev
        clz
        sec 
        clv
        clc
        nop
        .end  start
`

test(`basic xcc`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`NZVC`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`NZ••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•ZV•`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••V•`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••VC`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•••C`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);
})
