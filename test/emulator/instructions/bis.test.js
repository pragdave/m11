import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #12345, r0
        bis   #0, r0
        bis   #1, r0
        bis   #2, r0

        bis   #065430, r0
        bis   #100000, r0

        clr   r0
        bis   r0,r0
        .end  start
`

test(`basic bis word)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012345, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012345, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012347, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o077777, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o177777, `N•••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o000000, `•Z••` ]);
})


const t2 = `
start:  mov    #125, r0
        bisb   #0, r0
        bisb   #1, r0
        bisb   #2, r0

        bisb   #050, r0
        bisb   #200, r0

        clr    r0
        bisb   r0,r0
        .end  start
`

test(`basic bis byte)`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o0125, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o0125, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o0127, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o0177, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o377, `N•••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o000, `•Z••` ]);
})


