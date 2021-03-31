export function octal(val) {
  return `0o` + val.toString(8).padStart(6, `0`)
}

// add two signed 2-s complement 16 bit numbers and return another 16 bit number
export function saddw(n1, n2) {
  return (n1 + n2) & 0xffff
}
