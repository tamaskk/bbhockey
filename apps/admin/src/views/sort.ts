// Sort values the way a person expects: Hungarian alphabet, numbers by value (U8 < U10 < U12), empty last.
export const compare = (a: string, b: string, dir: 1 | -1) =>
  !a && !b ? 0 : !a ? 1 : !b ? -1 : dir * a.localeCompare(b, 'hu', { numeric: true, sensitivity: 'base' })

// null when the pattern is not a valid regex (the box turns red, nothing is filtered)
export const toRegex = (q: string) => {
  try {
    return new RegExp(q, 'i')
  } catch {
    return null
  }
}
