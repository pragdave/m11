import { assembleAndRun, octal } from "../../helpers"

test(`jmp mode1)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #one, r1
          jmp   (r1)
          inc   r0
  one:    halt
  next = .
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`one`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[1]).toBe(runner.symbol(`one`).value);
  expect(r[0]).toBe(0)
})

test(`jmp mode2)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #one, r1
          jmp   (r1)+
          inc   r0
  one:    halt
  next = .
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`one`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[1]).toBe(runner.symbol(`next`).value);
  expect(r[0]).toBe(0)
})

test(`jmp mode3)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #$one, r1
          jmp   @(r1)+
          inc   r0
  one:    halt
  $one:   .word one
  next = .
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`$one`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[1]).toBe(runner.symbol(`next`).value);
  expect(r[0]).toBe(0)
})

test(`jmp mode4)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #next, r1
          jmp   -(r1)
          inc   r0
  one:    halt
  next = .
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`next`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[1]).toBe(runner.symbol(`one`).value);
  expect(r[0]).toBe(0)
})

test(`jmp mode5)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #next, r1
          jmp   @-(r1)
          inc   r0
  one:    halt
  $one:   .word one
  next = .
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`next`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[1]).toBe(runner.symbol(`$one`).value);
  expect(r[0]).toBe(0)
})

test(`jmp mode6)`, () => {

  const t1 = `
  start:  clr   r0
          jmp   one
          inc   r0
  one:    halt
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[0]).toBe(0)
})


test(`jmp mode7)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #one, r1
          jmp   @2(r1)
          inc   r0
  one:    halt
          .word one
          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, _psw;

  [ r, m, _psw ] = runner.step();
  expect(r[0]).toBe(0);

  [ r, m, _psw ] = runner.step();
  expect(r[1]).toBe(runner.symbol(`one`).value);

  [ r, m, _psw ] = runner.step();
  expect(r[7]).toBe(runner.symbol(`one`).value)
  expect(r[0]).toBe(0)
})
