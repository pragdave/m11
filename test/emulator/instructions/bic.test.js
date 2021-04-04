import { assembleAndRun } from "../../helpers" 

const t1 = `
start:  mov   #12345, r0
        bic   #0, r0
        bic   #1, r0
        bic   #2, r0

        bic   #011111, r0
        bic   #100000, r0

        mov   #-1, r0
        bic   #070707, r0

        mov   #-1, r0
        bic   #107070, r0

        bic   #-1, r0
        .end  start
`

test(`basic bic word)`, () => {
  const runner = assembleAndRun(t1)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012345, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012344, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o012344, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o002244, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o002244, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o107070, `N•••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o070707, `••••` ]);

  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o000000, `•Z••` ]);
})


const t2 = `
start:  mov    #125, r0
        bicb   #0, r0
        bicb   #1, r0
        bicb   #2, r0

        bicb   #111, r0

        mov   #-1, r0
        bicb   #0307, r0

        movb   #377, r0
        bicb   #207, r0

        mov    #377, r0
        bicb   #-1, r0
        .end  start
`

test(`basic bic byte)`, () => {
  const runner = assembleAndRun(t2)
  let r, m, psw
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o125, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o124, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o124, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o024, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o177470, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o177570, `••••` ]);
  
  [ r, m, psw ] = runner.step();
  [ r, m, psw ] = runner.step();
  expect([ r[0],psw ]).toEqual([ 0o000000, `•Z••` ]);

})



