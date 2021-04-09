import { assemble } from "./main"
import { octal } from "./helpers"


function dumpMemory(memory) {
  let nextLoc = memory[0][0]

  memory.forEach(([ addr, bytes ]) => {
    let i = 0
    nextLoc = addr
    if (nextLoc & 1) {
      console.log(octal(nextLoc) + `: `, octal(bytes[i]))
      nextLoc++
      i++
    }
    while (i < bytes.length - 1) {
      console.log(octal(nextLoc) + `: `, octal(bytes[i] + (bytes[i + 1] << 8)))
      nextLoc += 2
      i += 2
    }

    if (i < bytes.length) {
      console.log(octal(nextLoc) + `: `, octal(bytes[i]))
    }
  })
}

const chunks = []

process.stdin.on(`readable`, () => {
  let chunk
  while (null !== (chunk = process.stdin.read())) {
    chunks.push(chunk)
  }
})


process.stdin.on(`end`, () => {
  const source = chunks.join(``)

  const assembled = assemble(source)
  console.dir(assembled)
  if (assembled.errorCount === 0) {
    dumpMemory(assembled.toMemory())
    console.log(`Entry point: ${octal(assembled.start_address)}`)
  }
})
