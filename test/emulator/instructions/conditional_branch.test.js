import { octal, assembleAndRun } from "../../helpers" 

test(`conditional branches with malice}`, () => {
  const code = `
    clr r0
    sen
    sez
    sev
    clc
    bmi  ok
    dec r0
    halt
  ok: inc r0
`
  const runner = assembleAndRun(code)
let r,m,psw
        for (let i = 0; i < 100; i++) {
          [ r, m, psw ] = runner.step();
          if (r[0] === 1) {
            expect(`pass`).toBe(`pass`)
            break
          }
          if (r[0] === 0o177777) {
            expect(`fail at ${octal(r[1])}: ${octal(m.w(r[1]))}`).toBe(`pass`)
            break
          }
        }
})

function branchTest(code) {
  const runner = assembleAndRun(code.join(`\n`))
  let r, m, psw

  for (let i = 0; i < 100; i++) {
    [ r, m, psw ] = runner.step();
    if (r[0] === 1) {
      expect(`pass`).toBe(`pass`)
      break
    }
    if (r[0] === 0o177777) {
      expect(psw).toBe(`pass`)
      break
    }
  }
}

for (let N of [ false, true ]) {
  for (let Z of [ false, true ]) {
    for (let V of [ false, true ]) {
      for (let C of [ false, true ]) {

        const psw = `${N ? `N` : `•`}${Z ? `Z` : `•`}${V ? `V` : `•`}${C ? `C` : `•`}`

        const reset = [
          N ? `sen` : `cln`,
          Z ? `sez` : `clz`,
          V ? `sev` : `clv`,
          C ? `sec` : `clc`,
        ]
        const willBranch = [];
        const wontBranch = [];

        (!N ? willBranch : wontBranch).push(`bpl`);
        ( N ? willBranch : wontBranch).push(`bmi`);
        
        (!Z ? willBranch : wontBranch).push(`bne`);
        ( Z ? willBranch : wontBranch).push(`beq`);
        
        (!V ? willBranch : wontBranch).push(`bvc`);
        ( V ? willBranch : wontBranch).push(`bvs`);
        
        (!C ? willBranch : wontBranch).push(`bcc`);
        ( C ? willBranch : wontBranch).push(`bcs`);
        
        (!C ? willBranch : wontBranch).push(`bhis`);
        ( C ? willBranch : wontBranch).push(`blo`);

        const NxorV = (N || V) && !(N && V);
        (!NxorV ? willBranch : wontBranch).push(`bge`);
        ( NxorV ? willBranch : wontBranch).push(`blt`);

        (!(Z || NxorV) ? willBranch : wontBranch).push(`bgt`);
        ( (Z || NxorV) ? willBranch : wontBranch).push(`ble`);

        ((!C && !Z) ? willBranch : wontBranch).push(`bhi`);
        ( (C || Z) ? willBranch : wontBranch).push(`blos`);

        for (let op of wontBranch) {
          test(`conditional branch ${op} shouldn't branch with ${psw}`, () => {
            const code = [...reset]
            code.push(`   ${op} error`)
            code.push(`   inc r0`)
            code.push(`error: dec r0`)
            branchTest(code)
          })
        }

        for (let op of willBranch) {
          test(`conditional branch ${op} shouldn't branch with ${psw}`, () => {
            const code = [...reset]
            code.push(`   ${op} ok`)
            code.push(`   dec r0`)
            code.push(`ok: inc r0`)
            branchTest(code)
          })
        }
        // for (let op of willBranch) {
        //   code.push(`   mov  pc,r1`)
        //   code.push(...reset)
        //   code.push(`   ${op} .+4`)
        //   code.push(`   br error`)
        // }

        // code.push(`       mov  #1, r0`)
        // code.push(`error: mov  #-1, r0`)

        // const runner = assembleAndRun(code.join(`\n`))
        // let r, m, psw

        // for (let i = 0; i < 100; i++) {
        //   [ r, m, psw ] = runner.step();
        //   if (r[0] === 1) {
        //     expect(`pass`).toBe(`pass`)
        //     break
        //   }
        //   if (r[0] === 0o177777) {
        //     expect(`fail at ${octal(r[1])}: ${octal(m.w(r[1]))}`).toBe(`pass`)
        //     break
        //   }
        // }

      // })

    }
  }
}
}

// bge 002000 br if greater or eq (to 0) ;::a n¥-v = 0
// blt 002400 br if less than (0) <0 n.orv = 1
// bgt 003000 br if greater than (0) >0 z v (n.orv) = 0
// ble 003400 br if less or equal (to 0) :;;;a z v (n.orv) = 1
// bhi 101000 branch if higher > cvz= 0
// blos 101400 branch if lower or same :::;;; cvz= 1
