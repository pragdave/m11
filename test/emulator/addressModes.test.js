import { assembleAndRun } from "../helpers" 
import { octal } from "../../src/helpers"

const t1 = `
. = 1000
start:  mov   #12345, r0
        mov   r0, r1
        mov   pc, r1
        .end  start
`

test(`register - register (word)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],r[1] ] ).toEqual([ 0o12345, 0]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 0o12345, 0o12345, 0 ]);
  [ r, m, psw ] = runner.step();
  expect(r[7]).toEqual(0o1010);
  expect(r[1]).toEqual(0o1010);
})

const t2 = `
. = 1000
start:  movb  #123, r0
        movb  r0, r1
        mov   #377, r2  ; positive as word, negative as byte
        movb  r2, r3   ; r2 should now be 177777
        .end  start
`

test(`register - register (byte)`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],r[1] ] ).toEqual([ 0o123, 0]);
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 0o123, 0o123, 0 ]);
  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o000377);
  [ r, m, psw ] = runner.step();
  expect([r[3], psw]).toEqual([0o177777, `N•••`]);
})

const t3 = `
input:  .word 5,4,3,2 
output: .word 0,0,0

start:  mov #input,  r1
        mov #output, r2
        mov (r1)+, r0
        mov r0, (r2)+
        mov (r1)+, (r2)+
        .end start
`
test(`autoincrement (word))`, () => {
  const runner = assembleAndRun(t3)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect([ r[1] ] ).toEqual([ 0o1000]);

  [ r, m, psw ] = runner.step();
  expect([ r[2] ] ).toEqual([ 0o1010]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 5, 0o1002, 0o1010 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 5, 0o1002, 0o1012 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1004, 0o1014 ]);
  expect(m.w(0o1010)).toBe(5)
  expect(m.w(0o1012)).toBe(4)
})

const t4 = `
input:  .byte 5,4,3,2 
output: .byte 0,0,0,0

start:  mov  #input,  r1
        mov  #output, r2
        movb (r1)+, r0
        movb r0, (r2)+
        movb (r1)+, (r2)+
        .end start
`
test(`autoincrement (byte))`, () => {
  const runner = assembleAndRun(t4)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1000);

  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o1004);
  
  [ r, m, psw ] = runner.step();

  expect([ r[0], r[1], r[2] ]).toEqual([ 5, 0o1001, 0o1004 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 5, 0o1001, 0o1005 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1002, 0o1006 ]);
  expect(m.b(0o1004)).toBe(5)
  expect(m.b(0o1005)).toBe(4)
})

const t5 = `
        .word 5,4
input = .

        .word 0,0
output = .

start:  mov  #input,  r1
        mov  #output, r2
        mov  -(r1), r0
        mov  r0, -(r2)
        mov  -(r1), -(r2)
        .end start
`
test(`autodecrement (word))`, () => {
  const runner = assembleAndRun(t5)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1004);

  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o1010);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 4, 0o1002, 0o1010 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1002, 0o1006 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1000, 0o1004 ]);
  expect(m.w(0o1004)).toBe(5)
  expect(m.w(0o1006)).toBe(4)
})


const t6 = `
        .byte 5,4
input = .

        .byte 0,0
output = .

start:  mov  #input,  r1
        mov  #output, r2
        movb -(r1), r0
        movb r0, -(r2)
        movb -(r1), -(r2)
        .end start
`
test(`autodecrement (byte))`, () => {
  const runner = assembleAndRun(t6)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1002);

  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o1004);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1], r[2] ]).toEqual([ 4, 0o1001, 0o1004 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1001, 0o1003 ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[1], r[2] ]).toEqual([ 0o1000, 0o1002 ]);
  expect(m.b(0o1002)).toBe(5)
  expect(m.b(0o1003)).toBe(4)
})


const t7 = `
input:  .byte 5,4,3,2 
output: .byte 0,0,0,0

start:  mov  #input,  r1
        mov  #output, r2
        movb 0(r1), 3(r2)
        movb 1(r1), 2(r2)
        movb 2(r1), 1(r2)
        movb 3(r1), 0(r2)
        .end start
`
test(`indexed (byte))`, () => {
  const runner = assembleAndRun(t7)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1000);

  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o1004);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();

  expect([ r[1], r[2] ]).toEqual([ 0o1000, 0o1004 ]);
  
  expect(m.b(0o1004)).toBe(2)
  expect(m.b(0o1005)).toBe(3)
  expect(m.b(0o1006)).toBe(4)
  expect(m.b(0o1007)).toBe(5)
})


/////////////////////////////////////////////////// deferred mode

const t11 = `
data:   .word 12345

start:  mov   #data, r0
        mov   (r0),  r1
        mov   @r0,   r2
       .end  start
`

test(`register deferred`, () => {
 const runner = assembleAndRun(t11)
 let r, m, psw

 [ r, m, psw ] = runner.step();
 expect(r[0]).toEqual(0o1000);

 [ r, m, psw ] = runner.step();
 expect(r[1]).toEqual(0o12345);

 [ r, m, psw ] = runner.step();
 expect(r[2]).toEqual(0o12345);
})

const t13 = `
one:    .word  1
two:    .byte  2
three:  .byte  3 
four:   .word  4

ptrs:   .word  one, two, three, four

start:  mov  #ptrs,  r1
        mov  @(r1)+, r0
        movb @(r1)+, r0
        movb @(r1)+, r0
        mov  @(r1)+, r0
        .end start
`
test(`autoincrement deferred`, () => {
  const runner = assembleAndRun(t13)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1006);

  [ r, m, psw ] = runner.step();
  expect([ r[0], r[1] ]).toEqual([ 1, 0o1010 ]);
  
})


const t15 = `
one:    .word  1
two:    .byte  2
three:  .byte  3 
four:   .word  4

        .word  one, two, three, four
inptrs = .


o$one:    .word  0
o$two:    .byte  0
o$three:  .byte  0 
o$four:   .word  0

          .word o$one, o$two, o$three, o$four
outptrs = .

start:  mov   #inptrs,  r1
        mov   #outptrs, r2
        mov   @-(r1), @-(r2)
        movb  @-(r1), @-(r2)
        movb  @-(r1), @-(r2)
        mov   @-(r1), @-(r2)
        .end start
`
test(`autodecrement deferred)`, () => {
  const runner = assembleAndRun(t15)
  let r, m, psw
  let ip = runner.symbol(`inptrs`).value;
  let op = runner.symbol(`outptrs`).value;

  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(ip);

  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(op);

  for (let i = 1; i <= 4; i++) {
    [ r, m, psw ] = runner.step();
    expect([ r[1], r[2] ]).toEqual([ ip - 2*i, op - 2*i ]);
  }

  const opdata = runner.symbol('o$one').value
  expect(m.w(opdata)).toBe(1)
  expect(m.b(opdata + 2)).toBe(2)
  expect(m.b(opdata + 3)).toBe(3)
  expect(m.w(opdata + 4)).toBe(4)

})


const t17 = `
input:  .word 20
        .byte 21
        .byte 22
        .word 23

output: .blkw 3

inptrs: .word input+0 
        .word input+2
        .word input+3
        .word input+4

outptrs: .word output+4 
         .word output+3
         .word output+2
         .word output+0


start:  mov  #inptrs,  r4
        mov  #outptrs, r5
        mov  @0(r4), @6(r5)
        movb @2(r4), @4(r5)
        movb @4(r4), @2(r5)
        mov  @6(r4), @0(r5)
        .end start
`
test(`indexed deferred)`, () => {
  const runner = assembleAndRun(t17)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();

  expect(m.w(0o1006)).toBe(0o20)
  expect(m.b(0o1010)).toBe(0o21)
  expect(m.b(0o1011)).toBe(0o22)
  expect(m.w(0o1012)).toBe(0o23)
})

// we've kinda already tested these, but just for completeness
// here are the PC-relative addressing modes

const t20 = `
. = 1000
v1:   .word 1200

. = 1200
v2:   .word 2345

. = 2000
start:  mov   #1234,  r0
        mov   @#1000, r1
        mov   1000,   r2
        mov   @1000,  r3
        .end  start
`
test(`PC related (src)`, () => {
  const runner = assembleAndRun(t20)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  expect(r[0]).toEqual(0o1234);

  [ r, m, psw ] = runner.step();
  expect(r[1]).toEqual(0o1200);
  
  [ r, m, psw ] = runner.step();
  expect(r[2]).toEqual(0o1200);
  
  [ r, m, psw ] = runner.step();
  expect(r[3]).toEqual(0o2345);
})

const t21 = `
. = 1000
    .word 0,0,0

. = 2000
start:  mov   #1234,  r0
        mov   r0, @#1000
        mov   #1002, r0
        mov   r0, 1000
        mov   #3456, r0
        mov   r0, @1000
        mov   #7654, 1000
        .end  start
`
test(`PC related (dst)`, () => {
  const runner = assembleAndRun(t21)
  let r, m, psw
  
  [ r, m, psw ] = runner.step(); //        mov   #1234,  r0
  expect(r[0]).toEqual(0o1234);

  [ r, m, psw ] = runner.step(); //        mov   r0, @#1000
  expect(m.w(0o1000)).toEqual(r[0]);
  
  [ r, m, psw ] = runner.step(); //        mov   #1002, r0
  [ r, m, psw ] = runner.step(); //        mov   r0, 1000
  expect(m.w(0o1000)).toEqual(r[0]);
  
  [ r, m, psw ] = runner.step(); //        mov   #3456, r0
  [ r, m, psw ] = runner.step(); //        mov   r0, @1000
  expect(m.w(0o1002)).toEqual(r[0]);
  
  [ r, m, psw ] = runner.step(); //        mov   #7654, 1000
  expect(m.w(0o1000)).toEqual(0o7654);
})


