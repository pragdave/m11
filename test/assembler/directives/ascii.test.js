import { assemble } from "../../../dist/main"

function charsIn(str) {
  return str.split('').map(s => s.charCodeAt(0))
}

test(`simple .ascii`, () => {
  const result = assemble(".ascii /hello/")
  expect(result.errorCount).toBe(0)
  const sl = result.sourceLines[0]
  expect(sl.type).toBe("CodegenLine")
  expect(sl.opcode).toBe("ascii")
  expect(sl.generatedBytes).toEqual(charsIn("hello"))
})

test(`simple .asciz`, () => {
  const result = assemble(".asciz /hello/")
  expect(result.errorCount).toBe(0)
  const sl = result.sourceLines[0]
  expect(sl.type).toBe("CodegenLine")
  expect(sl.opcode).toBe("asciz")
  expect(sl.generatedBytes).toEqual(charsIn("hello\0"))
})


test(`different delimiters`, () => {
  const result = assemble(".asciz 'hello'")
  expect(result.errorCount).toBe(0)
  const sl = result.sourceLines[0]
  expect(sl.type).toBe("CodegenLine")
  expect(sl.opcode).toBe("asciz")
  expect(sl.generatedBytes).toEqual(charsIn("hello\0"))
})


test(`trailing space`, () => {
  const result = assemble(".asciz 'hello'    ")
  expect(result.errorCount).toBe(0)
  const sl = result.sourceLines[0]
  expect(sl.type).toBe("CodegenLine")
  expect(sl.opcode).toBe("asciz")
  expect(sl.generatedBytes).toEqual(charsIn("hello\0"))
})


test(`trailing comment`, () => {
  const result = assemble(".asciz 'hello'  ; world  ")
  expect(result.errorCount).toBe(0)
  const sl = result.sourceLines[0]
  expect(sl.type).toBe("CodegenLine")
  expect(sl.opcode).toBe("asciz")
  expect(sl.generatedBytes).toEqual(charsIn("hello\0"))
})


