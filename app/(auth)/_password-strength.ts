/**
 * How a new password is assessed while it is being typed.
 *
 * Pure, so it runs in the browser as the person types and will run again in the
 * use case without a second implementation. It is **advice, never a gate**: the
 * only hard requirement is the minimum length, which the input enforces natively
 * and the action re-checks. A meter that refused to let somebody continue would be
 * a form that locks people out of their own finances over a judgement about their
 * passphrase.
 *
 * Length is weighted above character variety on purpose. "Tr0ub4dor&3" is the
 * password everybody was taught to write and it is weaker than four ordinary
 * words — the variety rules were designed around what a human finds hard to
 * remember, not around what a machine finds hard to guess.
 *
 * TODO(identity): this is `Password`'s value-object policy. It belongs in the
 * module with tests, and the use case must assess server-side regardless — a
 * client-side check is a courtesy to the user, never a control.
 */

/** Matches the `minLength` the inputs carry and the action will re-check. */
export const PASSWORD_MINIMUM_LENGTH = 8;

/** Long enough that variety stops mattering much; a passphrase reaches this easily. */
const PASSPHRASE_LENGTH = 16;

/** Where a password with decent variety starts counting as strong. */
const COMFORTABLE_LENGTH = 12;

const VARIETY_REQUIRED_FOR_STRONG = 3;

/** Consecutive characters before a run counts as a pattern: "1234", "abcd". */
const RUN_LENGTH = 4;

/**
 * Lowercased fragments that make a password guessable here specifically. A real
 * implementation checks a leaked-password corpus; this catches the handful that
 * this product and this language would actually attract.
 */
const PREDICTABLE_FRAGMENTS = [
  'senha',
  'password',
  'antiaposta',
  'aposta',
  '123456',
  'qwerty',
  'asdfgh',
] as const;

export type PasswordStrength = 'EMPTY' | 'WEAK' | 'FAIR' | 'STRONG';

export type PasswordAssessment = {
  readonly strength: PasswordStrength;
  /** Filled segments out of three, for the bar. */
  readonly filledSegments: number;
  /** The single most useful change, or `null` when there is nothing left to say. */
  readonly suggestion: string | null;
};

/** Lowercase, uppercase, digit, symbol — how many of the four appear. */
function countCharacterVariety(password: string): number {
  const classes = [/\p{Ll}/u, /\p{Lu}/u, /\d/, /[^\p{L}\d]/u];
  return classes.filter((pattern) => pattern.test(password)).length;
}

function isSingleRepeatedCharacter(password: string): boolean {
  return new Set(password).size === 1;
}

/** Four or more characters walking one step up or down the code points. */
function hasSequentialRun(password: string): boolean {
  let runLength = 1;

  for (let index = 1; index < password.length; index += 1) {
    const step = password.charCodeAt(index) - password.charCodeAt(index - 1);
    runLength = step === 1 || step === -1 ? runLength + 1 : 1;
    if (runLength >= RUN_LENGTH) return true;
  }

  return false;
}

function containsPredictableFragment(password: string): boolean {
  const folded = password.toLowerCase();
  return PREDICTABLE_FRAGMENTS.some((fragment) => folded.includes(fragment));
}

function isPredictable(password: string): boolean {
  return (
    isSingleRepeatedCharacter(password) ||
    hasSequentialRun(password) ||
    containsPredictableFragment(password)
  );
}

/**
 * One suggestion at a time, the one with the most to gain. A list of five things
 * to fix reads as a telling-off and gets ignored whole.
 */
function toSuggestion(password: string, variety: number): string | null {
  if (password.length < COMFORTABLE_LENGTH) {
    return 'Senhas mais longas são mais seguras. Três ou quatro palavras funcionam bem.';
  }
  if (variety < VARIETY_REQUIRED_FOR_STRONG) {
    return 'Misture letras maiúsculas, minúsculas, números ou símbolos.';
  }
  return null;
}

export function assessPassword(password: string): PasswordAssessment {
  if (password.length === 0) {
    return { strength: 'EMPTY', filledSegments: 0, suggestion: null };
  }

  if (password.length < PASSWORD_MINIMUM_LENGTH) {
    return {
      strength: 'WEAK',
      filledSegments: 1,
      suggestion: `Use pelo menos ${PASSWORD_MINIMUM_LENGTH} caracteres.`,
    };
  }

  if (isPredictable(password)) {
    return {
      strength: 'WEAK',
      filledSegments: 1,
      suggestion: 'Evite sequências, repetições e palavras comuns — são as primeiras testadas.',
    };
  }

  const variety = countCharacterVariety(password);
  const isStrong =
    password.length >= PASSPHRASE_LENGTH ||
    (password.length >= COMFORTABLE_LENGTH && variety >= VARIETY_REQUIRED_FOR_STRONG);

  if (isStrong) {
    return { strength: 'STRONG', filledSegments: 3, suggestion: null };
  }

  return {
    strength: 'FAIR',
    filledSegments: 2,
    suggestion: toSuggestion(password, variety),
  };
}

/**
 * The words the meter shows. Colour cannot carry this — the palette is monochrome
 * and red is reserved for gambling amounts — so the label is the whole signal.
 */
export const PASSWORD_STRENGTH_LABELS: Readonly<Record<PasswordStrength, string>> = {
  EMPTY: '',
  WEAK: 'Senha fraca',
  FAIR: 'Senha razoável',
  STRONG: 'Senha forte',
};
