import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  tst   #0
        tst   #1
        tst   #077777 
        tst   #-1
        tst   #100000 
        .end  start
`

test(`basic tst`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);
})


const t2 = `
start:  tstb   #0
        tstb   #1
        tstb   #070377 
        tstb   #-1
        tstb   #010200 
        .end  start
`

test(`basic tst`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);
})


