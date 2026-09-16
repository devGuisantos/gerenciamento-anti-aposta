/**
 * Makes a `switch` over a union exhaustive: adding a member to the union turns
 * every unhandled `switch` into a compile error instead of a silent fallthrough.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled union member: ${JSON.stringify(value)}`);
}
