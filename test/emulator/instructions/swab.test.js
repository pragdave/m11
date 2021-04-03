import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #123000, r0
        swab  r0
        swab  r0
        mov   #100001, r0
        swab  r0
        swab  r0
        .end  start
`

test(`basic swab`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toequal([ 0o000246, `n•••` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toequal([ 0o123000, `•z••` ]);

  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toequal([ 0o000600, `n•••` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0], psw ]).toequal([ 0o100001, `••••` ]);
})


