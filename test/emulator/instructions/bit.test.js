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

test(`basic bit word)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  //                                 123456 &
  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      3
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      3
  expect(psw).toEqual(`••••`);


  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);
})


const t2 = `
start:  bitb   #123, #0
        bitb   #123, #1 
        bitb   #123, #2
        bitb   #123, #3

        bitb   #0, #123
        bitb   #1, #123
        bitb   #2, #123
        bitb   #3, #123

        bitb   #100, #200
        bitb   #300, #200
        .end  start
`

test(`basic bit byte`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw

  //                                    123 &
  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      3
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      0
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();  //      1
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      2
  expect(psw).toEqual(`••••`);

  [ r, m, psw ] = runner.step();  //      3
  expect(psw).toEqual(`••••`);


  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`•Z••`);

  [ r, m, psw ] = runner.step();
  expect(psw).toEqual(`N•••`);
})




