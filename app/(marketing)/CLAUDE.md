# `app/(marketing)/` — public pages

Unauthenticated, fully static. The landing page has one job: make a visitor understand, in about
ten seconds, that the app shows them what their betting actually costs — and that it does so
without blocking, judging, or lecturing.

## Layout

`layout.tsx` owns the sticky header (logo, anchor nav, Entrar/Criar conta) and the footer. The
footer always carries the support resources — **CVV 188** and Jogadores Anônimos — and the
academic disclaimer that the Open Finance data is simulated. Neither is optional: someone who
arrives here in crisis must find help without creating an account.

## Page structure

The landing page sections, in order, each with an `id` matching the header anchors:

1. **Hero** — the System 2 reframing as the headline (amount spent vs. amount forgone), two CTAs,
   and `NudgePreview`: a mock of the real nudge card, so the product is visible before signup.
2. **`#numeros`** — the four national figures, each with its source inline (BCB 2024,
   FEBRABAN/IPESPE 2024). Never cite a statistic here without its source.
3. **`#como-funciona`** — three numbered steps: connect, detect, reframe.
4. **Habit section** — goals, streaks, badges. Copy frames these as the user's own progress
   (autonomy and competence per SDT), never as rewards we hand out.
5. **`#limites`** — what the platform does **not** do. This section is mandatory and must not be
   softened for marketing reasons; it is what separates this product from the thing it opposes.
6. **Final CTA.**

## Conventions

- Section content lives in `as const` arrays at the top of the file, not inline in JSX — the copy
  is the thing that changes most, so keep it in one readable block.
- Figures shown in the hero mock are illustrative and must stay plausible: a real 12-month fixed
  income yield on the amount shown, not an inflated number.
- Sections alternate plain background and `bg-muted/30` for rhythm. Cards use the `Card`
  primitive; icon chips use `bg-accent text-accent-foreground` (the azul detail).
- Anything interactive would make this a Client Component — keep it server-rendered. If a section
  needs interactivity, extract just that piece into `_components/` with `"use client"`.
