# `app/` — delivery layer

Everything here is an **adapter**. Pages read through use cases resolved from `src/container.ts`;
Server Actions and Route Handlers parse input, call one use case, map the result to a response.
No `prisma.*` in a component, no business rule in a page.

## Next.js 16 conventions

Read `node_modules/next/dist/docs/` before writing framework code — this version differs from
older Next.js in ways that matter here:

- `params` and `searchParams` are **Promises**: `const { id } = await params`.
- `middleware.ts` is deprecated → use **`proxy.ts`** at the project root, exporting `proxy`.
- Route Handlers are **not cached** by default. Opt in deliberately, never for user data.
- Caching uses the `use cache` directive with `cacheLife(...)`. Nothing derived from a user's
  financial data is ever cached.
- Layout and page props use the generated helpers — `LayoutProps<"/">`, `PageProps<"/rota">`.
  Route groups do not appear in the route literal, so every root-level group layout is
  `LayoutProps<"/">`.
- Server Components by default. `"use client"` only on leaves that need state, effects, or event
  handlers — push it as far down the tree as it goes.
- **Server Actions are public POST endpoints.** Every `"use server"` function re-authenticates and
  re-authorises _inside itself_. Never assume it was only reachable from a protected page.
- Loading and error states use `loading.tsx` / `error.tsx`, not ad-hoc spinners in the tree.

```ts
'use server';
export async function revokeConsentAction(formData: FormData) {
  const session = await requireSession();
  const input = revokeConsentSchema.parse({ consentId: formData.get('consentId') });
  const result = await container.revokeConsent.execute({ ...input, userId: session.userId });
  if (result.isFailure) return { error: toUserMessage(result.error) };
  revalidatePath('/platform/consents');
}
```

## Components

- Add primitives with `npx shadcn@latest add <component> -y`. Do not hand-write what the registry
  already has. Vendored primitives live in `components/ui/` — see that folder's own CLAUDE.md.
- `src/shared/ui/` holds **our** components, composed from the primitives and named after the
  domain (`Logo`, `MoneyText`, `NudgeCard`). Domain-aware presentation belongs there, never in
  `components/ui/`.
- Import `cn` from `"cn"` (shadcn's own package), not from `clsx` + `tailwind-merge`.
- This style is compact: `Button`/`Input` default to `h-8`, `size="lg"` to `h-9`. Pass
  `className="h-10"` on primary form controls and hero CTAs.
- Every input has a real `<Label htmlFor>`, an `autoComplete`, and native validation attributes.

## Palette — one brand hue, everything else earns its colour

Tinted neutrals plus **a single brand hue at OKLCH 255** (blue), defined in `app/globals.css`.
An earlier version was pure greyscale; before that a three-colour brand (coffee/creme/azul) was
tried and rejected. This is the middle position and it holds only because of the division below.

**Why 255, and why only one hue.** Every other hue in the file already means something: 27 is
`--destructive` (a gambling amount), 80 is `--spend-medium`, 150 is `--spend-none`. A brand colour
near any of those would look like it was reporting something and would not be. Blue is the only
family left — and it is also the safest against red for colour-blind readers: measured at ΔE 26
under protanopia with `scripts/validate_palette.js`, where red against amber manages 0.6.

**The division that keeps red meaningful** — this is the rule, not the hue:

- The brand hue appears on **brand and interaction only**: buttons, the logo mark, focus rings,
  progress fills, the active nav item, an earned badge mark, tinted surfaces.
- It **never lands on a figure, a status or a classification**. A number, a badge that reports an
  outcome, a transaction row, a chart series that encodes a band — none of those may wear it.
- **Red (`text-destructive`) stays reserved** for gambling amounts and genuinely negative signals.
  It is still the only colour in the product that *means* anything, and the only reason that works
  is that nothing competes with it for attention.
- **`--spend-none` / `--spend-medium` / `--spend-high` are untouched** and still the only colours
  allowed on the betting figure.
- Raw Tailwind palette classes (`text-emerald-600`, `bg-sky-500`, …) remain **banned**. Use the
  semantic tokens: `bg-primary`, `bg-background`, `bg-card`, `bg-muted`, `text-muted-foreground`,
  `border-border`, `bg-accent`.
- Hierarchy still comes from **type scale, weight, spacing and surface elevation**. The hue is not
  a substitute for any of them; a screen that needs colour to be legible is a screen with a
  layout problem.
- Colour never carries meaning alone: every red amount is accompanied by a label or icon saying
  what it is (the `Aposta` badge, the "Gasto com apostas" heading). Required for colour-blind
  users, and non-negotiable.

**One exception, decorative by definition:** `--celebration-1` … `--celebration-5` exist for the
milestone confetti (`@shared/ui/milestone-confetti`, fired by a reached savings goal and by an
awarded badge, and by nothing else). They are allowed to be colourful precisely because they encode
nothing — `aria-hidden`, repeating what a dialog already said, gone in two seconds. Every hue is
kept clear of `--destructive` so a particle can never read as a gambling amount. Do not reach for
these anywhere else.

**Every pair is measured, not eyeballed.** Both themes pass WCAG AA on body, muted, button,
sidebar and accent text, and 3:1 on marks and focus rings. Changing a token means re-checking it —
`--muted-foreground` on `--muted` passes at 4.57:1 in light mode, which is the tightest pair in the
file and the one a casual darkening of the surface will break first.

**Dark mode is live.** shadcn supplies the `.dark` tokens and the `dark:` variant; `next-themes`
supplies the switching. `ThemeProvider` (`@shared/ui/theme-provider`) wraps the app in the root
layout with `attribute="class"` and `defaultTheme="system"`, `<html>` carries
`suppressHydrationWarning` because the theme class is set by a blocking script before hydration,
and `ThemeToggle` (`@shared/ui/theme-toggle`) sits in all three headers as a single button that
flips light ↔ dark. There is deliberately no "system" option in the UI: `defaultTheme="system"`
still means an untouched install follows the OS, and the first click pins an explicit choice.
Consequences for new UI:

- Use tokens and nothing else, and both themes come out right for free. A hard-coded colour is now
  a bug in one of the two themes, guaranteed.
- **`--background` is tinted and `--card` is white**, so a card lifts off the page in light mode
  the way it always did in dark. This used to be the other way round — both were pure white, which
  made a `bg-background` panel inside a `Card` invisible in light mode while looking correct in
  dark. That footgun is gone, but the advice that replaced it still stands: for a surface that must
  read as *inset* on a card, use `bg-muted`, which separates in both themes. `bg-background` is for
  things sitting on the page itself, like the sticky day header and the app header.
- Never read the resolved theme during render to pick an icon or a class — it mismatches on
  hydration. Render both states and swap them with `dark:` classes, as `ThemeToggle` does.

## Responsive — mobile and desktop, both first-class

Most of the target audience will open this on a phone, often a cheap one. Every screen is built
mobile-first and must work from 360px up.

- Start with the single-column mobile layout, then add `sm:` / `md:` / `lg:` to expand. Never write
  a desktop layout and patch it downward.
- Page gutters are `px-4 sm:px-6`; content is centred in `max-w-6xl`.
- The body must never scroll horizontally. Wide content (tables, long rows) scrolls inside its own
  `overflow-x-auto` container.
- Tap targets are at least 36px on touch: header buttons are `h-9 md:h-8`, form controls `h-10`.
  The compact `h-7`/`h-8` defaults are desktop-only sizes.
- Anything hidden behind a breakpoint needs a mobile equivalent. The marketing header hides its
  anchor nav on `md:` and renders a scrollable row underneath instead — hiding navigation with no
  replacement is a bug, not a responsive design.
- Check 360px, 768px and 1280px before calling a screen done.

## Copy

Portuguese (pt-BR), plain and short. Never claim the platform blocks or prevents a transaction —
it reads data, it does not intercept payments. Numbers cited from research carry their source
inline. Never moralise about the user's spending.
