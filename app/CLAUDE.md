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

## Palette — neutral, monochrome

The default shadcn `neutral` palette in `app/globals.css`: grayscale surfaces and text, light theme
with a `.dark` block. A branded palette (coffee/creme/azul) was tried and rejected — do not
reintroduce decorative colour.

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
- **Tokens are not automatically distinct from each other.** In the light theme `--background` and
  `--card` are both pure white, so a `bg-background` panel inside a `Card` is invisible there while
  looking correct in dark mode, where they differ. For a surface that has to read as raised or
  inset on a card, use `bg-muted` — it separates in both themes. `bg-background` is only for things
  sitting on the page itself, like the sticky day header and the app header.
- Never read the resolved theme during render to pick an icon or a class — it mismatches on
  hydration. Render both states and swap them with `dark:` classes, as `ThemeToggle` does.

- Hierarchy comes from **type scale, weight, spacing and surface elevation**, not hue.
- Raw Tailwind palette classes (`text-emerald-600`, `bg-sky-500`, …) are **banned**. Use the
  semantic tokens: `bg-background`, `bg-card`, `bg-muted`, `text-muted-foreground`,
  `border-border`.
- **Red (`text-destructive`) is reserved** for gambling amounts and genuinely negative signals. It
  is the only colour in the product, which is exactly what gives it force.
- Colour never carries meaning alone: every red amount is accompanied by a label or icon saying
  what it is (the `Aposta` badge, the "Gasto com apostas" heading). Required for colour-blind
  users, and non-negotiable.

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
