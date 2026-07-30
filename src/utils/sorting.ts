export const compareValues = (left: string | number, right: string | number): number => {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}
