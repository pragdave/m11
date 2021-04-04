import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  bit   #123456, #0
        bit   #123456, #1 
        bit   #123456, #2
        bit   #123456, #3

        bit   #0, #123456
        bit   #1, #123456
        bit   #2, #123456
        bit   #3, #123456

        bit   #040000, #123456
        bit   #140000, #123456
        .end  start
`

test(`basic bit)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  //                                 123456 &
  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);


  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);
})



