import { assembleAndRun, octal } from "../../helpers"

test(`jmp (modes 1 to 4)`, () => {

  const t1 = `
  start:  clr   r0
          jmp   one

  ; last instruction is "mov #five, r5; jmp -(r5)"
  ; so it should jumop to the next line

          inc   r1
  five:   mov   #-1, r1

  three:  mov   #$four, r4
          jmp   @(r4)+

  two:    mov   #three, r3
          jmp   (r3)+

  one:    mov   #two, r2
          jmp   (r2)

  $four:  .word four
  four:   mov   #five, r5
          jmp   -(r5)

          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, psw

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[2]).toBe(runner.symbol(`two`).value)
  expect(r[3]).toBe(runner.symbol(`three`).value + 2)
  expect(r[4]).toBe(runner.symbol(`$four`).value + 2)
  expect(r[5]).toBe(runner.symbol(`five`).value - 2)
  expect(r[1], `if R1 is -1, then jmp -(r5) failed`).toBe(1)
})

test(`jmp (modes 5 to 7)`, () => {

  const t1 = `
  start:  clr   r0
          mov   #five, r2
          jmp   @-(r2)

          .word five

  five:   mov   #base, r3
          jmp   4(r3)

  base:   dec   r1 ; these are errors.
          dec   r1 ; ...

  f3:     mov   #base1, r4 ; and this is 4(r3)
          jmp   @4(r4)


  base1:  .word f11, f12, f13

  f11:     mov  #-1111, r1
  f12:     mov  #-2222, r1

  f13:     mov  #1, r1

          .end  start
  `

  const runner = assembleAndRun(t1)
  let r, m, psw

  do
    [ r, m, psw ] = runner.step();
  while (r[1] === 0)

  expect(r[1]).toBe(1)
})
