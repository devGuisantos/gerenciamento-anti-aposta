'use client';

import {
  assessPassword,
  PASSWORD_STRENGTH_LABELS,
} from '../_password-strength';

/** Three, matching `filledSegments`: weak, razoável, forte. */
const SEGMENT_COUNT = 3;

/**
 * How strong the password being typed is, in words first.
 *
 * **Monochrome, and that is not a limitation here.** The usual meter runs red to
 * green, and neither colour is available: red in this product means a gambling
 * amount, and spending it on a weak password would cost the one signal that
 * carries meaning. So the bar is filled segments of the text colour and the label
 * says the rest — which is what a colour-blind reader would have needed anyway.
 *
 * It advises and never blocks. `minLength` on the input is the only hard rule.
 */
export function PasswordStrengthMeter({
  password,
  describedById,
}: {
  readonly password: string;
  /** Lets the input point at this with `aria-describedby`. */
  readonly describedById: string;
}) {
  const assessment = assessPassword(password);

  if (assessment.strength === 'EMPTY') return null;

  return (
    <div className="space-y-1.5">
      <div aria-hidden className="flex gap-1">
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < assessment.filledSegments ? 'bg-foreground' : 'bg-foreground/15'
            }`}
          />
        ))}
      </div>

      {/* Polite, not assertive: this changes while somebody is typing, and an
          assertive region would interrupt them on every keystroke. The text only
          actually changes when the level or the suggestion does. */}
      <p id={describedById} aria-live="polite" className="text-xs text-muted-foreground">
        <span className="text-foreground">
          {PASSWORD_STRENGTH_LABELS[assessment.strength]}
        </span>
        {assessment.suggestion === null ? '' : ` · ${assessment.suggestion}`}
      </p>
    </div>
  );
}
