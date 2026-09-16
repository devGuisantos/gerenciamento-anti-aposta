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

## `/admin` — the demo console

An unlisted route that publishes notifications by hand while the modules do not exist. It is
deliberately **not** in `NAV_GROUPS`: reachable only by typing the URL, and `robots: noindex`.

`isDemoConsoleEnabled()` gates the page and both API routes — on outside production, off inside
unless `ENABLE_DEMO_CONSOLE=true`. The page is `dynamic = 'force-dynamic'` so that flag is read per
request; static rendering would bake the build-time answer in and 404 forever.

Notifications are delivered by real Server-Sent Events, so this exercises the transport the
`notifications` module will own rather than faking it with local state. `NotificationListener` in
the layout subscribes once for the whole app: an awareness nudge opens a **modal** (§4.1 of the
TCC), everything else is a toast. Publishing reaches every connected browser, not one user — fine
for a demo, unacceptable for the real thing.

## Data

Screens currently read `_mock-snapshot.ts` fixtures: **integer cents**, matching the `Money` type
that will replace them. Each file says which use case supersedes it. Rules while the modules are
being built:

- Fixtures stay display data. The moment a fixture needs a calculation, that calculation belongs in
  a domain service, not here.
- Keep the numbers internally consistent — the yield figure must actually be the spend times the
  rate. An inconsistent demo is worse than an empty one.
- Format money only through `MoneyText` / `formatBRL` from `@shared/ui/money-text`.

## `/transactions` — the statement screen

Modelled on the extrato/ledger screens of Nubank, Monzo and Revolut, minus the parts users
complain about. Its parts live in `transactions/`:

- `_ledger-entry.ts` is the row shape, mirroring `open-finance`'s `Transaction` plus
  `bet-detection`'s `BetClassification`, so swapping the fixture out is a change of source only.
- `_accounts.ts` is the connected-account registry. Entries carry an `accountId`, never an account
  name — the label is presentation and belongs in one place.
- `_ledger-view.ts` resolves dates into labels and holds the pure filter/group/total functions.
- `_components/` holds the interactive leaves; `page.tsx` stays a Server Component.

Rules this screen establishes:

- **Dates are resolved once, on the server.** Rows arrive carrying `dayLabel`, `timeLabel` and
  `daysAgo`; the client filters and groups but never calls `new Date()`. That is also why the page
  is `dynamic = 'force-dynamic'` — a static render would freeze "Hoje" at build time.
- **Grouped by day with a sticky header** (`top-14`, under the app header) showing the day's net.
  Amounts are right-aligned `tabular-nums`; the whole row is the tap target, not a chevron.
- **Search and filters are the point.** The most-repeated complaint about Brazilian banking apps is
  an extrato you can only scroll. Search folds accents and case — nobody types "Pão de Açúcar"
  with the diacritics.
- **Progressive disclosure.** The row shows the badge and the matching policy; the detail dialog
  carries the explanation, the confidence and the reframing. Do not crowd the row with it.
- **Uncertainty is visible.** A `LOW`-confidence match renders "Possível aposta" in an outline
  badge, never the flat "Aposta" — `bet-detection` reports the lowest confidence of the policies
  that agreed, and the UI must not launder that into a certainty.
- **Accounts are told apart by shape and by words, never by colour.** The palette is monochrome, so
  a row stamps its account kind onto the category glyph (`EntryAvatar`) and names the account in
  the subtitle; the marker is `aria-hidden` because the text already carries it. Shape does not
  scale past a handful of accounts — if a third arrives, the words stay and the badge gives way.
- **Account numbers are masked at the fixture**, never in the component. Only the last four digits
  exist in the app, so there is nothing to leak into a log or an RSC payload.
- The fixture's eleven bets inside 30 days sum to the dashboard's monthly figure on purpose, and it
  holds exactly the two accounts the snapshot counts. Change one and change the other.
- `SelectValue` needs **explicit children**. Radix fills it from the selected item, and items only
  register once the portal opens — leave it empty and the trigger renders blank on the server.

## `/transactions/insights` — the charts

Transações is two pages behind one sidebar entry, switched by `SectionTabs`. A nav entry owns its
sub-routes (`isCurrentSection` in `app-sidebar.tsx`), so the section stays highlighted.

Charts are Recharts via the shadcn `chart` primitive. The rules that produced this screen:

- **One series at a time, one axis.** The reader picks the metric; the chart never plots two
  measures together. A dual-axis chart invents a correlation that is not in the data, and two
  series would need a categorical palette this product does not have.
- **No legend for a single series** — the card title already names what is plotted.
- **The betting series is the only coloured one**, banded by `_spend-level.ts`. Everything else
  uses `--chart-2`, the neutral mid-grey.
- **The bands are drawn, not just coloured.** `validate_palette.js` measures amber against red at
  ΔE 0.6 under protanopia — indistinguishable. So the betting chart draws reference lines at
  R$ 100 and R$ 1.000 (`BAND_FLOORS_IN_CENTS`, exported from the same file that picks the colour so
  the two cannot disagree), and the tooltip names the band in words. Position carries the meaning;
  colour only reinforces it.
- **The category breakdown is ranked magnitude, not identity** — one neutral fill, sorted, with
  betting the single highlighted row. Nine hues would bury the row that matters.
- **Animation is gated on hydration**, not on an effect. `useIsHydrated` holds a `Skeleton` until
  the browser takes over so the entrance actually plays, and `usePrefersReducedMotion` turns it off
  for anyone who asked for less motion. Both are `useSyncExternalStore` — React 19 lints
  `setState` inside an effect.

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
