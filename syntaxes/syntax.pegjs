program
  = line+

line 
  = line_content _ EOL
  
line_content
  = direct_assignment
  / label* operator _ operand? comment?
  / label+
  / comment
  / ''

direct_assignment
  = symbol _ "=" _ expression

label
  = symbol ':' ':'?

operator
  = directive
  / opcode


// addressing

register_mode
  = register_name

deferred_register_mode
  = "(" register_name ")" !"+" 
  / "@" register_name

autoincrement_mode
  = "(" register_name ")+"

deferred_autoincrement_mode
  = "@(" register_name ")+"

autodecrement_mode
  = "-(" register_name ")"

deferred_autoincrement_mode
  = "@-(" register_name ")"

index_mode
  = expression "(" register_name ")"

deferred_index_mode
  = expression "@(" register_name ")"

immediate_mode
  = "#" expression

deferred_immediate_mode
  = "@#" expression

relative_mode
  = expression

deferred_relative_mode
  = "@" expression

A
  = register_mode
  / deferred_register_mode
  / autoincrement_mode
  / deferred_autoincrement_mode
  / autodecrement_mode
  / deferred_autoincrement_mode
  / index_mode
  / deferred_index_mode
  / immediate_mode
  / deferred_immediate_mode
  / relative_mode
  / deferred_relative_mode

inst_double_operand 
  = opcode_double_operand _ A _ , _ A

inst_single_operand 
  = opcode_single_operand _ A

inst_operate
  = opcode_operate

inst_branch
  = opcode_branch expression

inst_subroutine_call
  = opcode_subroutine_call register_mode _ "," _ A

inst_subroutine_return
  = opcode_subroutine_return register_mode 

inst_emt_trap
  = opcode_emt_trap expression?


opcode_double_operand
  = "mov" byte
  / "cmp" byte
  / "bit" byte
  / "bic" byte
  / "bis" byte
  / "add"
  / "sub"

opcode_single_operand
  = "clr" byte
  / "com" byte
  / "inc" byte
  / "dec" byte
  / "neg" byte
  / "adc" byte
  / "sbc" byte
  / "tst" byte
  / "ror" byte
  / "rol" byte
  / "asr" byte
  / "asl" byte
  / "jmp"
  / "swab"

opcode_operate
  = "halt"
  / "wait"
  / "rti"
  / "reset"
  / "clc"
  / "sec"
  / "clv"
  / "sev"
  / "clz"
  / "sez"
  / "cln"
  / "sen"
  / "cnz"
  / "ccc"
  / "scc"
  / "nop"

opcode_branch
  / "br"
  / "bne"
  / "beq"
  / "bge"
  / "blt"
  / "ble"
  / "bpl"
  / "bmi"
  / "bhi"
  / "blos"
  / "bvc"
  / "bvs"
  / ( "bcc" / "bhis" )
  / ( "bcs" / "blo" )

opcode_subroutine_call
  = "jsr"

opcode_subroutine_return
  = "rts"

opcode_emt_trap
  = "iot"
  / "emt"
  / "trap"

byte
  = "b"i?

register_name
  = [rR%] [0-7] 
  / "sp"i
  / "pc"i


expression
  = term ( [-+*/&!] term )*

term
  = octal_number
  / one_ascii_character
  / two_ascii_characters
  / unary_op
  / "<" expression ">"

one_ascii_character
  = "'" ascii_character

two_ascii_characters
  = '"' ascii_character ascii_character


ascii_character
  = (![\r\n\f] .)

unary_op
  = "^C" octal_number
  / "^C" unary_op
  / "^B" binary_number
  / "^D" decimal_number
  / "^F" float_number
  / "^O" octal_number
  / "^R" rad50_string

symbol
  = [a-zA-Z$.][a-zA-Z0-9$.]*
_ 
  = WS*

__ 
  = WS+

WS
  = [ \t]

EOL
  = "\r"? "\n"
