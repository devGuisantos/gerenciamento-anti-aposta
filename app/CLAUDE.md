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

## Palette — coffee dominant

One theme, defined in `app/globals.css`. There is **no light mode** and no `.dark` block, so the
appearance is deterministic; `color-scheme: dark` is set so native controls and scrollbars match.

| Role                       | Hex       | Token                                 |
| -------------------------- | --------- | ------------------------------------- |
| Coffee — surfaces (main)   | `#241A12` | `--background`                        |
| Coffee, one step up        | `#31241A` | `--card`, `--popover`                 |
| Coffee, raised             | `#3D2E22` | `--muted`, `--secondary`              |
| Creme — highlight          | `#FDFBD4` | `--primary` (CTA fill), `--creme`     |
| Creme, softened for text   | `#F5F0D6` | `--foreground`                        |
| Creme, dimmed              | `#C0AB92` | `--muted-foreground`                  |
| Azul — details             | `#82C8E5` | `--azul`, `--ring`, `--positive`      |
| Azul, dark fill            | `#2F4A58` | `--accent` (icon chips)               |
| Coffee brand mark          | `#6F4E37` | `--coffee`                            |

Rules:

- Raw Tailwind palette classes (`text-emerald-600`, `bg-sky-500`, …) are **banned**. Every colour
  comes from a token, so nothing drifts off-brand.
- Creme is the **highlight**, used in small doses: the primary CTA, the progress fill, key
  emphasis. It is not a background.
- `text-positive` (azul) is the "what this money could have earned" colour — the yield figure,
  never a raw hex.
- Primary buttons are creme with coffee text (`--primary-foreground` `#33241A`), which is the
  highest-contrast pair in the palette and makes the CTA the loudest thing on the page.
- Every foreground/background pair clears WCAG AA (≥ 4.5:1); the weakest is muted text on a raised
  surface at 5.88:1. Check any new pair before committing.

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
