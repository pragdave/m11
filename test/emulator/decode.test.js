import { decode } from "../../src/emulator/instruction_decode"
import { MockEmulator } from "./mock_emulator"

const emulator = new MockEmulator();

([
  [ 0o000000, `halt` ],
  [ 0o000001, `wait` ],
  [ 0o000002, `rti` ],
  [ 0o000003, `bpt` ],
  [ 0o000004, `iot` ],
  [ 0o000005, `reset` ],
  [ 0o000006, `rtt` ],
]).forEach(([instruction, op]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, `mock_decode_none`, `decode_none`])
  })
});


([
  [ 0o104345, `emt`, 0o345 ],
  [ 0o104745, `trap`, 0o345 ],
]).forEach(([instruction, op, value]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, value, `decode_trap`])
  })
});

([
  [ 0o000240, `ccc` ],
  [ 0o000277, `scc` ],
]).forEach(([instruction, op]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, `mock_decode_cc`, `decode_cc`])
  })
});

test(`decode rts`, () => {
  decode(emulator, 0o000205)
  expect(emulator.result).toEqual([`rts`, 5, `decode_rts`])
});

test(`decode jsr`, () => {
  decode(emulator, 0o004467)
  expect(emulator.result).toEqual([`jsr`, 0o467, `decode_jsr`])
});

([
  [ 0o000400, `br`, 0 ],
  [ 0o001000, `bne`, 0 ],
  [ 0o001400, `beq`, 0 ],
  [ 0o002000, `bge`, 0 ],
  [ 0o002400, `blt`, 0 ],
  [ 0o003000, `bgt`, 0 ],
  [ 0o003400, `ble`, 0 ],
  [ 0o100000, `bpl`, 0 ],
  [ 0o100400, `bmi`, 0 ],
  [ 0o101000, `bhi`, 0 ],
  [ 0o101400, `blos`, 0 ],
  [ 0o102000, `bvc`, 0 ],
  [ 0o102400, `bvs`, 0 ],
  [ 0o103000, `bcc`, 0 ],
  [ 0o103400, `bcs`, 0 ],
]).forEach(([instruction, op, value]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, value, `decode_branch`])
  })
});

([
  [  0o000100, `jmp` ],
  [  0o000300, `swab` ],
  [  0o005000, `clr` ],
  [  0o105000, `clrb` ],
  [  0o005100, `com` ],
  [  0o105100, `comb` ],
  [  0o005200, `inc` ],
  [  0o105200, `incb` ],
  [  0o005300, `dec` ],
  [  0o105300, `decb` ],
  [  0o005400, `neg` ],
  [  0o105400, `negb` ],
  [  0o005500, `adc` ],
  [  0o105500, `adcb` ],
  [  0o005600, `sbc` ],
  [  0o105600, `sbcb` ],
  [  0o005700, `tst` ],
  [  0o105700, `tstb` ],
  [  0o006000, `ror` ],
  [  0o106000, `rorb` ],
  [  0o006100, `rol` ],
  [  0o106100, `rolb` ],
  [  0o006200, `asr` ],
  [  0o106200, `asrb` ],
  [  0o006300, `asl` ],
  [  0o106300, `aslb` ],
  [  0o106400, `mtps` ],
  [  0o006500, `mfpi` ],
  [  0o106500, `mfpd` ],
  [  0o006600, `mtpi` ],
  [  0o106600, `mtpd` ],
  [  0o006700, `sxt` ],
  [  0o106700, `mfps` ],
]).forEach(([instruction, op]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, `mock_decode_single`, `decode_single`])
  })
});


([
  [ 0o070000, `mul` ],
  [ 0o071000, `div` ],
  [ 0o072000, `ash` ],
  [ 0o073000, `ashc` ],
  [ 0o074000, `xor` ],
]).forEach(([instruction, op]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, `mock_decode_one_and_a_half`, `decode_one_and_a_half`])
  })
});


([
  [ 0o010000, `mov` ],
  [ 0o110000, `movb` ],
  [ 0o020000, `cmp` ],
  [ 0o120000, `cmpb` ],
  [ 0o030000, `bit` ],
  [ 0o130000, `bitb` ],
  [ 0o040000, `bic` ],
  [ 0o140000, `bicb` ],
  [ 0o050000, `bis` ],
  [ 0o150000, `bisb` ],
  [ 0o060000, `add` ],
  [ 0o160000, `sub` ],
]).forEach(([instruction, op]) => {
  test(`decode ${op}`, () => {
    decode(emulator, instruction)
    expect(emulator.result).toEqual([op, `mock_decode_double`, `decode_double`])
  })
});
