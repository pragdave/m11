# M11: An Incomplete PDP-11 Assembler and Emulator

The assembler syntax is based on the original Macro-11 assembler (including all
the `^D` and `"#ab` foibles. It does not implement macros or program sectioning.

The emulator does not implement the PDP-11 hardware, and so cannot (for example) boot RT11.
Even if it could, it would run slowly.

So, enough of the positive sales points.

This code exists because I needed a PDP-11 emulator for a course I'm developing.
This repository contains the assembler and emulator, and
https://github.com/pragdave/pdp11-playground contains the front end.

The assembler is intended to be informative when it comes across errors. It
tries to localize the problem, and to give error messages that would be helpful
to a novice. It also exports a full symbol table along with the binary form of
the code.

The emulator needed a few features that other PDP-11 emulators didn't have:

* easy access to the processor state (registers, PSW, and memory) after each
  instruction.

* tracking of all reads and writes to both memory and registers (which allows
  the front end to highlight thigs affected by the code.

* ability to add EMT extensions in order to fake out OS calls (such as .print)

# API

You probably don't want to do any of this: I can't imagine this code being of
use to anyone except me. However...


## Assemble Source Code

~~~ js
import { assemble } from "m11"

const result = assemble(..some source code..)
~~~

The `result` object contains:

* `original_code`

   The source code you supplied to the `assemble` function.

* `error_count`

   The number of errors found during assembly. 

* `unresolved_names`

   An object where the property names are the names of unresolved names, and
   their values are the lists of line numbers where those names were referenced.

* `sourceLines`

   A list of objects corresponding to each line of source, along with any code
   that the line generated. This representation makes it easier to provide a
   more usable front end.

   The sourceLine objects all include the line's type and any source-code
   comment found on that line. The individual types are:

   * `BlankLine`

      A blank line (or line with just a comment). No additional attributes

   * `AssignmentLine`

     The symbol being assigned to, the RHS expression, and the value of that
     expression. (This is provided simnply to give the front end something to
     display: the semantics of the assignment happen in the assembler.)

   * `JustLabelsLine`

     A source line containing just one or more labels. The properties are a list
     of labels and runtime address they refer do.

   * `CodeGenLine`

     A line that actually contains code that is loaded into runtime memory. The
     attributes are:

     * the address of the start of the code
     * a list of zero or more labels
     * the opcode
     * the source of the operands (called the rhs)
     * the bytes to be loaded into memory

   * `ErrorLine`

     Corresponds to a line containing an error:

     * the error message
     * the source of the line
     * the line and column numbers
     * the type and content of the symbol that caused the error.

## Running the Code

Two componments collaborate to run the code:

`MachineState` represents the current state of the hardward (memory, registers,
status, and so on).

`Emulator` performs the emulation.

The simplest case is to run code you just assembled:

~~~ js
import { assemble, Emulator, MachineState } from m11

const build = assemble(...my source...)

const hardware = new MachineState(callbacks)
state.loadAssembledCode(build)

const emulator = new Emulator(hardware)

let state = emulator.step()    // or emulator.run()
~~~

The state that is returned by `step` and `run` contains the updated state of the
hardware following the execution of the code by the emulator:

* `memory`

  The processor memory. Can be accessed via `getWord`, `getByte`, `setWord`,
  `setByte`. Also supports the auditor callback, used to keep track of accesses.

* `psw`

  The processor status word is actually stored in memory location 177776, but is
  also available using this attribute.

* `registers`

  The processor registers, accessed as `state.registers[n]`, where `n` is 0 to
  7.

* `processorState`

  ~~~ js
  import { PS } from `m11`
  ~~~

  Which gives you: PS.Halted, PS.Paused, PS.Running, PS.Trapped, and PS.Waiting.


----

# License

Copyright ® 2021 Dave Thomas (pragdave)

[MIT License](./LICENSE.md)
