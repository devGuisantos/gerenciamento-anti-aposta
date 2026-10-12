/**
 * One regex literal backs both the input's `pattern` and the action's schema,
 * read through `.source` — the bug `/goals` documents, where a string with a
 * single backslash turned `\d` into the letter `d`, cannot happen twice.
 *
 * pt-BR first: "50,90". A dot is accepted too, because people type both.
 */
export const AMOUNT_PATTERN = /\d{1,7}([,.]\d{1,2})?/;
