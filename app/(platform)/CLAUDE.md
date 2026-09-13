# `app/(platform)/` — the authenticated app

Everything behind the sidebar. The marketing and auth route groups deliberately do **not** share
this layout: a visitor should never see the app chrome before there is data in it.

## Layout

`layout.tsx` wraps every screen in `TooltipProvider` → `SidebarProvider` → `AppSidebar` +
`SidebarInset`. The header holds the `SidebarTrigger`, a link back to the site, and the
"Dados simulados" marker that must stay until real Open Finance data flows.

- **Desktop:** the sidebar collapses to icon width (`collapsible="icon"`). Labels disappear, icons
  remain, and each button carries a `tooltip` so the icon is never unexplained. The open/closed
  choice persists in a cookie, handled by `SidebarProvider`.
- **Mobile:** below 768px the same sidebar renders as a slide-over sheet, opened by the trigger,
  which is why the trigger is visible at every width. Do not build a second mobile nav — the
  primitive already handles it.
- `AppSidebar` is a Client Component solely because it reads `usePathname()` for the active item.
  Screens themselves stay Server Components.

## Width

App screens are **not** reading columns. Content fills the inset:
`mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8`, and the header uses the same
horizontal padding so the trigger lines up with the content edge. The 1600px cap only bites on
ultrawide monitors. Do not reuse the marketing `max-w-6xl` here — on a 1080p screen it leaves a
third of the viewport empty on either side.

## Showing and hiding with sidebar state

To vary UI by sidebar state, read it: `const { state, isMobile } = useSidebar()`. Descendant CSS
variants (`group-data-[collapsible=icon]:**:data-[slot=x]:hidden`) are brittle — one failed
silently here and hid the logo's icon instead of its wordmark, which is invisible until someone
looks at the rendered page. State is explicit and testable.

## Navigation

`NAV_GROUPS` in `_components/app-sidebar.tsx` is the single source of truth, and each entry maps to
a bounded context in `src/modules`. Adding an item means adding its route in the same commit —
a nav entry that 404s is a broken nav, which is why the unimplemented screens render
`PlaceholderPage` naming the module that will own them.

## Data

Screens currently read `_mock-snapshot.ts` fixtures: **integer cents**, matching the `Money` type
that will replace them. Each file says which use case supersedes it. Rules while the modules are
being built:

- Fixtures stay display data. The moment a fixture needs a calculation, that calculation belongs in
  a domain service, not here.
- Keep the numbers internally consistent — the yield figure must actually be the spend times the
  rate. An inconsistent demo is worse than an empty one.
- Format money only through `MoneyText` / `formatBRL` from `@shared/ui/money-text`.

## Dashboard conventions

- **Exactly one hero figure per view** (≥48px). On the dashboard it is the monthly betting spend,
  in red — that is the number the product exists to confront the user with, and the 12-month yield
  equivalent sits directly beside it, labelled as an estimate with its rate stated.
- Stat tiles carry label (sentence case) · value · one line of detail. Deltas are signed and named
  against a period, and take red only when the direction is genuinely bad.
- `tabular-nums` belongs in columns of numbers (transaction rows), never on the hero figure, where
  it makes digits look loose.
- Every betting row shows the `Aposta` badge and how it was detected (`MCC 7995`, CNPJ) — the user
  is owed the reason, and it is what makes the classification auditable.
- Copy stays retrospective and non-judgemental. No screen may imply the platform could have
  blocked a transaction.
