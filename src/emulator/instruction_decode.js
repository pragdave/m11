export const decodeTable =  [
  {
    mask: 0o170000,
    decode: `decode_double`,
    opcodes: {
      0o010000: `mov`,
      0o110000: `movb`,
      0o020000: `cmp`,
      0o120000: `cmpb`,
      0o030000: `bit`,
      0o130000: `bitb`,
      0o040000: `bic`,
      0o140000: `bicb`,
      0o050000: `bis`,
      0o150000: `bisb`,
      0o060000: `add`,
      0o160000: `sub`,
    },
  },

  {
    shift: 9,
    mask: 0o177000,
    decode: `decode_sob`,
    opcodes: {
      0o077000: `sob`,
    },
  },

  {
    shift: 9,
    mask: 0o177000,
    decode: `decode_one_and_a_half`,
    opcodes: {
      0o070000: `mul`,
      0o071000: `div`,
      0o072000: `ash`,
      0o073000: `ashc`,
      0o074000: `xor`,
    },
  },

  {
    mask: 0o177700,
    decode: `decode_single`,
    opcodes: {
      0o000100: `jmp`,
      0o000300: `swab`,
      0o005000: `clr`,
      0o105000: `clrb`,
      0o005100: `com`,
      0o105100: `comb`,
      0o005200: `inc`,
      0o105200: `incb`,
      0o005300: `dec`,
      0o105300: `decb`,
      0o005400: `neg`,
      0o105400: `negb`,
      0o005500: `adc`,
      0o105500: `adcb`,
      0o005600: `sbc`,
      0o105600: `sbcb`,
      0o005700: `tst`,
      0o105700: `tstb`,
      0o006000: `ror`,
      0o106000: `rorb`,
      0o006100: `rol`,
      0o106100: `rolb`,
      0o006200: `asr`,
      0o106200: `asrb`,
      0o006300: `asl`,
      0o106300: `aslb`,
      0o006400: `mark`,
      0o106400: `mtps`,
      0o006500: `mfpi`,
      0o106500: `mfpd`,
      0o006600: `mtpi`,
      0o106600: `mtpd`,
      0o006700: `sxt`,
      0o106700: `mfps`,
    },
  },

  {
    shift: 8,
    mask: 0o177400,
    decode: `decode_branch`,
    opcodes: {
      0o000400: `br`,
      0o001000: `bne`,
      0o001400: `beq`,
      0o002000: `bge`,
      0o002400: `blt`,
      0o003000: `bgt`,
      0o003400: `ble`,
      0o100000: `bpl`,
      0o100400: `bmi`,
      0o101000: `bhi`,
      0o101400: `blos`,
      0o102000: `bvc`,
      0o102400: `bvs`,
      0o103000: `bcc`,
      0o103400: `bcs`,
    },
  },

  {
    mask: 0o177000,
    decode: `decode_jsr`,
    opcodes: {
      0o004000: `jsr`,
    },
  },

  {
    mask: 0o177770,
    decode: `decode_rts`,
    opcodes: {
      0o000200: `rts`,
    },
  },

  {
    mask:  0o177400,
    decode: `decode_trap`,
    opcodes: {
      0o104000: `emt`,
      0o104400: `trap`,
    },
  },


  {
    mask:  0o177760,
    decode: `decode_cc`,
    opcodes: {
      0o000240: `ccc`,
      0o000260: `scc`,
    },
  },

  {
    shift: 0,
    mask:  0o177777,
    decode: `decode_none`,
    opcodes: {
      0o000002: `rti`,
      0o000003: `bpt`,
      0o000004: `iot`,
      0o000006: `rtt`,
      0o000000: `halt`,
      0o000001: `wait`,
      0o000005: `reset`,
    },
  },

]

