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

## Session gate

Every screen here requires a session, enforced in two layers:

- **`proxy.ts` (repo root)** redirects to `/login` when the session cookie is absent, and on a GET
  re-issues a present one with a fresh max-age to mirror the backend's sliding session — never on a
  POST, where a Server Action may be writing the same cookie. Optimistic only — it never calls the
  backend. **Its `matcher` lists every route in this group: a new screen is added there in the same
  commit**, or it is reachable signed out.
- **`requireSession()` from `@modules/identity`** is the real check: it resolves the cookie against
  `GET /identity/sessions/current` and redirects to `/login` on a rejected session. **Every
  `page.tsx` here opens with `await requireSession()`, and so does every Server Action** — a layout
  does not re-render on client navigation, so a check that lived only there would let a revoked
  session keep browsing. It is `cache`d: the layout and the page share one backend call per load.
  Route Handlers use `findCurrentUser()` and answer `401` instead of redirecting.

The sidebar footer shows the signed-in name and e-mail and holds "Sair", a `<form>` posting to
`_sign-out-action.ts`, which revokes the session on the backend and drops the cookie.

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

An unlisted route for demonstrations, deliberately **not** in `NAV_GROUPS`: reachable only by
typing the URL, and `robots: noindex`. It does two things, both **to one person, chosen by user
id** (`RecipientField`, which starts as the presenter's own id and shows it to copy):

- **Books movements at the simulated bank** on that person's account (`BankLedgerPanel` →
  `BankLedgerForm`). The bank then notices the platform, which synchronises at once, and the
  person's open screens update over the stream. A person who never reached the bank has no accounts
  there yet, and the panel says so — the listing opens none.
- **Sends notifications by hand** (`NotificationConsole`): the nudge, badges, a broken streak, a
  reached goal — the ones the detection and gamification flows will emit on their own. A nudge
  carries only the amount; the backend reframes it.

Security: every action calls `requireSession()`, and the backend mounts the console's routes
(`/sandbox/bank/customers/…`, `/api/v1/users/{id}/notifications`) **only where demo writes are
on — never in production**. That switch is the property, not the unlisting: any signed-in person
may use the console, so it must not exist where real people are. Off, the backend answers 404 and
the console says it is unavailable here.

`NotificationListener` in the layout subscribes once for the whole app: an awareness nudge opens a
**modal** (§4.1 of the TCC) and so does an awarded badge (`BadgeAwardedDialog`, with confetti),
while a broken streak, a reached goal and new transactions are toasts. That split is a product
decision rather than a styling one — see `/achievements` below, and
`src/modules/notifications/CLAUDE.md`.

## Data

Every screen here reads backend-anti-aposta through `@modules/*`; **no fixtures remain**. Money
arrives as `{ amountInCents, currency }` and the view files flatten it to **integer cents**.

- **Every figure is the backend's.** A view file labels, words and sizes bars; it never sums,
  derives or estimates a number another screen also shows. The moment one needs a calculation, it
  belongs in a backend use case.
- Format money only through `MoneyText` / `formatBRL` from `@shared/ui/money-text`.

## `/transactions` — the statement screen

Modelled on the extrato/ledger screens of Nubank, Monzo and Revolut, minus the parts users
complain about. It reads **real backend data**: `GET /transactions` and `GET /accounts` through
`@modules/open-finance`, the correction through `@modules/bet-detection`. Its parts live in
`transactions/`:

- `page.tsx` parses the URL, reads the backend and composes; it stays a Server Component.
- `_statement-params.ts` maps the URL to `StatementFilters` and back. `filter`/`period` keep the
  values other screens link with (`?filter=bets&period=all`; `180d`/`360d` exist for `/bets`);
  `account`, `bookmaker` and `q` are the rest. `bookmaker` is opaque and never rendered — the hero's
  scope says "uma casa de apostas", and an id the reader's history lacks is the backend's 404.
- `_statement-view.ts` turns the backend's rows into `StatementRow`s with every date a label.
  `_statement-labels.ts` holds the Portuguese for the backend's enums (category, method).
- `_actions.ts` holds the three Server Actions: the next page, the correction and its undo.
- `_components/` holds the interactive leaves.
- `_detection.ts` holds the detection types and their Portuguese; `_accounts.ts` names an account.

Rules this screen establishes:

- **The backend filters, totals and pages; the URL is the state.** A filter change is a
  `router.replace`, and the server re-reads that slice. The hero is the backend's figure for the
  **whole** matching set (net of refunds), never a sum of the loaded rows — a total over a page is
  a figure that moves as you scroll. Search is debounced (350 ms) and folds accents on the backend
  (Postgres `unaccent`), so "acucar" still finds "Pão de Açúcar".
- **No consent is not zero.** `syncStatus` `NO_CONSENT` and `SYNCING` render `StatementUnavailable`
  — a sentence and, for no consent, a link to `/accounts` — never an empty list under a R$ 0,00
  hero, which would read as "you spent nothing on bets". The charts follow the same rule.
- **Dates are resolved once, on the server**, in `America/Sao_Paulo` explicitly — the server may run
  on UTC, where a bet at 22:30 reads as the next morning. Day grouping uses the backend's `dayKey`,
  never one re-derived here. The page is `dynamic = 'force-dynamic'`: one person's data, and a
  static render would freeze "Hoje".
- **Grouped by day with a sticky header** (`top-14`, under the app header) showing the day's net.
  The **last** day's net is withheld while more pages remain, because that day may continue.
  Amounts are right-aligned `tabular-nums`; the whole row is the tap target, not a chevron.
- **"Carregar mais" follows the backend's opaque cursor**, through `loadNextPageAction`. The loaded
  pages are keyed on the filters **and** the first page's cursor: a refresh that brings new rows
  moves that cursor and drops the stale pages, rather than splicing two versions of the list.
- **New movements slide in, and only new ones.** `useArrivals` remembers the ids a slice has shown;
  rows that appear later **in the same slice** (a refresh after the bank's notice) slide and fade
  in once. Nothing animates on first load or on a filter change — motion on every render would
  teach people it means nothing. Position and opacity only, never colour (a coloured row would read
  as a classification), and `motion-safe:` only.
- **Progressive disclosure.** The row shows the badge and the matching policy; the detail dialog
  carries the explanation, the confidence and the reframing — the yield figure and the rate are the
  backend's (`awareness`), never computed here. Do not crowd the row with it.
- **The correction is real and reversible.** "Isto não é uma aposta" records an override on the
  backend that outranks the classifier for that transaction; the hero, the charts, the streak, the
  ceiling and the support offer all recompute there. No "tem certeza?": the toast carries
  "Desfazer", and a corrected row shows "Corrigida por você" (outline, never red) with "Desfazer
  correção" in its dialog. The open row takes the backend's answer at once and the screen
  `refresh()`es. Never fake a success state: the UI changes only on the backend's answer.
- **Uncertainty is visible.** A `LOW`-confidence match renders "Possível aposta" in an outline
  badge, never the flat "Aposta" — `bet-detection` reports the lowest confidence of the policies
  that agreed, and the UI must not launder that into a certainty.
- **Accounts are told apart by shape and by words, never by colour.** The palette is monochrome, so
  a row stamps its account kind onto the category glyph (`EntryAvatar`) and names the account in
  the subtitle; the marker is `aria-hidden` because the text already carries it. Shape does not
  scale past a handful of accounts — if a third arrives, the words stay and the badge gives way.
- **Account numbers are masked by the backend at ingestion**, never in the component. Only the
  last four digits exist in the app, so there is nothing to leak into a log or an RSC payload. A
  stale `account` id in the URL is dropped against the account list before it reaches the backend,
  which would otherwise answer 404 for the whole page.
- **Client components import types from the modules, never values.** The modules are server-only
  (`next/headers`); one value import from a file the browser loads breaks the route at build.
- `SelectValue` needs **explicit children**. Radix fills it from the selected item, and items only
  register once the portal opens — leave it empty and the trigger renders blank on the server.

## `/accounts` — Contas conectadas, the Open Finance flow

The first screen in this group that read **real backend data** rather than a fixture: the consent,
the shared accounts and the newest statement rows all come from backend-anti-aposta. `/transactions`
, `/transactions/insights`, `/bets`, `/goals`, `/achievements` and the dashboard now do too. The
header's "Dados simulados" stays regardless: the DataHolder is still the simulated bank, so every
figure is real arithmetic over synthetic movements.

- **One card per state, decided by the backend's status.** `AUTHORISED` shows `ConsentCard`
  (accounts, last sync, "Sincronizar", "Revogar"); anything else shows `ConnectCard`, which says
  what is read and what is not *before* the person leaves for the bank, plus one neutral line about
  the last attempt (`PREVIOUS_CONSENT_COPY`).
- **"Conectar" is a plain `<form action>`**, so it works before hydration; the action redirects the
  browser to the bank's own screen (`app/sandbox/authorize`), outside this layout on purpose.
- **The outcome comes back as a code.** `/api/open-finance/callback` redirects here with
  `conexao`/`motivo`; `ConnectionNotice` renders from `CONNECTION_FAILURE_COPY` and falls back to
  one generic line. Never render a query-string value as text.
- **Sync says what it found, including nothing.** "Tudo em dia" is an answer, not an error.
- **Revoking states the consequence and stops.** No red, no second confirmation, no "tem certeza?".
- **Movements arrive on their own.** When the bank books something on a shared account it notices
  the platform, which synchronises over the protocol; `TRANSACTIONS_INGESTED` on the stream makes
  `NotificationListener` call `router.refresh()`, so this screen and `/transactions` re-read in
  place. The statement still changes only because the platform read the bank — never because the
  bank wrote into it. "Sincronizar" stays for when the notice did not land.
- **The simulated bank's ledger is on `/admin`**, not here: booking a movement is the bank's side
  of a demonstration, and a person's own accounts screen is not where they would do it.

## `app/sandbox/` — the bank's screens

Outside `(platform)`: the person has *left* anti-aposta for their bank, and the screenshot has to
show the hand-over. Its own header with the bank's name and a "Banco simulado" marker, no sidebar,
the same tokens. `proxy.ts` gates it like the app (the platform session stands in for the bank's
login). A request the bank refuses is answered on the bank's screen and **never redirected** — a
bad redirect is where an authorisation code must not go. Nothing on the authorisation screen is
pre-selected.

## `/bets` — the consumption reframing

It reads **one backend call**, `GET /bets/summary?days=` through `@modules/bet-detection`, so every
section describes the same window. `_bets-view.ts` turns it into labels and bar widths and decides
no figure; `_equivalences.ts` words the equivalences. `NO_CONSENT`/`SYNCING`/a failure render
`StatementUnavailable`, and a window with no bets renders a neutral R$ 0,00 (`text-spend-none`) and
nothing else.

`AccumulatedCost` carries two reframings of the same total: fixed income answers "what would it
have become", the `SpendingEquivalences` carousel answers "what would it have bought".

- **The hero is net of refunds** and equals the statement's `betSpend` for the same window to the
  cent; the refunds line says how much was netted off. "Ver no extrato" opens
  `?filter=bets&period=<n>d` — the same slice, never a wider one.
- **A house is the backend's grouping**, keyed by an opaque `bookmakerId`, not by the counterparty
  string. The summary does not carry a house's rows: the dialog shows how each policy matched and
  links to the statement filtered by that house, which pages.
- **A confidence travels with the reason that earned it.** The dialog pairs `weakest.confidence` with
  `weakest.matchedBy`; the row names every policy that matched.
- **Quantities are divided out of the real total on the backend, never written down.** An item the
  amount does not cover is not sent. "1 carro" beside R$ 2.320,00 would discredit every other figure.
- **Two sources, kept apart.** Months of the reader's own grocery or rent bill invent nothing — the
  unit price is their own average over complete months, and the detail line says so. The object
  prices are a catalogue the backend keeps as data with a review date; still approximations, which
  is why the card calls them that.
- **Auto-advance needs an off switch.** WCAG 2.2.2: anything moving on its own past five seconds
  must be pausable. It stops on hover, on keyboard focus, and on a visible button, and never starts
  for `prefers-reduced-motion`.

## `/goals` — two kinds of goal, deliberately kept apart

The screen carries two things the user calls a meta, and they are **known in completely different
ways**. Saying which is which is the screen's main job:

| | Savings goals | Betting ceiling |
| --- | --- | --- |
| Source | the user records it | measured from transactions we read |
| Backend | `GET/POST /savings-goals`, `…/{id}/movements` | `GET/PUT /betting-ceiling` |
| Files | `_savings-goal.ts`, `_savings-goals-view.ts` | `_ceiling-view.ts` |
| Can be wrong because | the user forgot to log a deposit | the classifier missed a bet |

Never merge them into one figure, and never let savings copy borrow the certainty the ceiling has.

Both halves read `@modules/gamification` (backend `gamification`, contract in
`backend-anti-aposta/docs/features/goals.md`); `page.tsx` makes the two calls in parallel, and
`_actions.ts` holds the four Server Actions (create, record, history page, set ceiling), each opening
with `requireSession()`. **Every figure is the backend's** — the views turn month keys into labels and
money objects into cents, and decide nothing.

## `/goals` — savings goals

Self-reported, and every screen says so. Open Finance shows a statement; it does not show that a
transfer was *meant* as savings and never sees cash in a drawer. So the user records the movements
and the app keeps the ledger — the honest version of a savings goal.

- **The balance is summed from the movements, never stored** — on the backend, which also refuses a
  withdrawal above it (`INSUFFICIENT_BALANCE`, with `details.savedInCents` the action formats). A
  kept total and a list that disagree would have the user believing the total.
- **The history is not a nice-to-have.** A balance with no history is an assertion: somebody who
  logged the wrong amount has nothing to check against, and this is a number they are trusting us
  to keep. It lives behind a dialog so the cards stay scannable on a phone, and it is **read when the
  dialog opens**, one backend page at a time with "Carregar mais" — re-read on every opening so a
  movement just recorded is in the list its balance is summed from.
- **Recording a movement carries an `Idempotency-Key`**, minted in the event handler that opens the
  dialog (never during render). A submit retried on a slow connection books the amount once.
- **Withdrawal informs and then stops.** It carries the trade-off because the user asked to be
  told, but with no warning colour, no "tem certeza?", no delay and no second confirmation.
  Manufactured loss aversion is on the forbidden list, and somebody moving their own money back
  into their own week may have a reason the app knows nothing about. `MOVEMENT_COPY` holds both
  directions together so they stay parallel in tone.
- **No red on a savings card, ever** — not even when a goal loses money. Red here means a gambling
  amount; spending it on the user's own withdrawal makes the app pass judgement on a decision it
  cannot see.
- **`MovementDirection` is a union, not a boolean.** `recordMovement({ isDeposit: false })` reads
  like nothing, and the direction has to survive into the copy, the icon and the history label.
- **The confetti is the mechanic that comes closest to the forbidden list, so its limits are
  load-bearing.** `MilestoneConfetti` (Motion, and in `@shared/ui` because `/achievements`
  celebrates with the same burst) fires here on exactly one thing: the movement that
  *crosses* a target the user set. The backend decides that — `reachedNow`, from the
  `SavingsGoal` aggregate, which records `SavingsGoalReached` — and the client never infers it,
  because a celebration the browser talked itself into is a celebration for something that may not
  have happened. What follows from the rules, and must not be "improved" later:
  - No confetti on a deposit that does not finish the goal. Applause for participation is the
    same bin as a badge nobody earned.
  - No confetti on a deposit into an already-finished goal, and none on any withdrawal. A goal is
    reached **once**: drawn down and refilled, it does not celebrate again (`reachedAt` stays set
    while `isReached` follows the balance).
  - **No near-miss.** It never plays at 90% and nothing teases it — a near-miss animation is the
    precise effect a slot machine sells, and this product exists to oppose that psychology.
  - Randomness decides how the particles fly, never *whether* they appear. A variable-ratio
    celebration is a gambling loop with better manners.
  - It carries **no information**: the toast and the card's "Alcançada" badge both say it, so
    anyone who never sees it misses nothing. That is what lets it be skipped for
    `prefers-reduced-motion` (WCAG 2.3.3) and marked `aria-hidden` / `pointer-events-none`.
  - **The one place with decorative colour** (`bg-celebration-1` … `-5`), allowed only because it
    encodes nothing and is `aria-hidden`; the hues stay clear of `--destructive` so a particle
    never reads as a gambling amount. The tokens carry a light and a dark value each — `bg-chart-*`
    would not work here, being fixed greys identical in both themes, so half of them would vanish
    into one of the two backgrounds. Nothing outside this burst may use these tokens.
  - Particles are built in the event handler (`createConfettiBurst`), never during render:
    `Math.random()` in render is impure and React 19 may render twice and get two bursts. It
    portals to `document.body` so no transformed ancestor can capture the `fixed` overlay, and
    one particle's `onAnimationComplete` clears the burst so there is no timer to leak.
- **The forms submit inside a `useTransition`, not `useActionState`,** so a dialog can close itself
  on success without a `setState` in an effect — which React 19 lints, and which would close the
  dialog a render later than it should.
- **One regex literal backs both the input's `pattern` and the action's schema** (`AMOUNT_PATTERN`,
  read through `.source`). Written as a string it needs doubled backslashes, and a single one turns
  `\d` into the letter `d`: a pattern that compiles, looks right, and silently matches "ddd"
  instead of "250". That exact bug shipped here once and was caught only by exercising the action.
- **Amounts are `type="text"` with `inputMode="decimal"`**, never `type="number"`: this audience
  writes "250,50", and a number input in a pt-BR browser can hand the server an empty string for a
  comma it decided not to parse.
- **Server Actions are public POST endpoints.** Each opens with `requireSession()` and the backend
  scopes every goal by the caller — somebody else's id answers 404 there. The action still re-checks
  every bound the form already enforced, in Portuguese, because it is reachable with any payload.

## `/goals` — the betting ceiling

A goal here is a **monthly ceiling on betting spend**, plus what the user said the money is for.
Both halves come from them, which is the autonomy half of the SDT mapping; the months behind them
are the competence half. It reads `GET /betting-ceiling`, which measures every month against the
ceiling in force in it — using `open-finance`'s monthly summary, the same figures
`/transactions/insights` draws — and precomputes the simulator. `_ceiling-view.ts` labels the month
keys in São Paulo time and snaps the slider to the backend's steps. `destination` is optional on the
backend and nothing on this screen sets it yet; the line that quotes it renders only when present.

Rules this screen establishes:

- **A goal is only ever measured against what the platform can see.** The ceiling is checked
  against transactions that were already read, so nothing on the screen depends on the user
  telling us something unverifiable. The dashboard's old `savedInCents` was exactly that, and it
  is gone: we see a bank statement, not a deposit somebody meant to make, and a progress bar
  filled from a figure like that is a progress bar that lies. `destination` is a statement of
  intent and never a balance — **no copy may suggest the platform moves money.**
- **The hero is the spend, not the target.** Same reason as the dashboard: a goal screen that
  leads with the target lets the reader look away from the number the product exists to show them.
- **A month past its ceiling is reported, then pointed at the next one.** Neutral wording, the
  ceiling restarts, and the earlier months stay on the screen — the same treatment a broken streak
  gets. `CycleStatusBadge` names the outcome in words first; red appears only on `MISSED`, and
  only because what sits above the ceiling is itself a betting amount.
- **Months before the first goal have no cycle.** Measuring them against a ceiling the user had
  not chosen invents a failure they never agreed to.
- **Closed months only, everywhere it matters.** The open month is half a month: it is the hero,
  never a row in the record and never an input to the simulation, which would understate every
  ceiling tried. There is deliberately **no month-end projection** — a pace estimate from half a
  month is a guess wearing a forecast's clothes. Days remaining is a fact and says enough.
- **No consent is not zero.** `NO_CONSENT`, `SYNCING` and a failure render `StatementUnavailable`
  in place of the measured half — never a R$ 0,00 hero that reads as "you did not bet".
- **The simulator answers in counts and differences, never in advice.** It does not recommend a
  value and it does not claim the money would have gone somewhere better — the person may well
  have spent it on something else, and a screen that pretends otherwise sells a regret instead of
  reporting a number. Its figures are the backend's stops; the slider only chooses which to read.
- **The month under way keeps the ceiling it started with.** "Usar R$ X como minha meta" sets the
  ceiling for real (`PUT /betting-ceiling`): a first ceiling governs this month, a change is
  scheduled for next month, and the toast says which. The hero card names a scheduled change. No
  "tem certeza?", and the screen changes only on the backend's answer.
- **A slider announces its raw value**, so the control works in whole reais and restores cents on
  the way out — "1200" is sayable, "120000" is not. Its visible caption is a `<p>`, not a
  `<label htmlFor>`: the focusable element is a thumb inside the primitive, so there is nothing
  for a `for` to point at. The accessible name repeats the caption and adds the unit (WCAG 2.5.3).
  **Local change to `components/ui/slider.tsx`:** the preset spreads every prop onto the root span
  and leaves the thumb — the element with `role="slider"` — unnamed, so the wrapper now forwards
  `aria-label`/`aria-labelledby` to it. Keep that on re-add.

## `/achievements` — the gamification pillar

The `gamification` module's screen, and the one place in the product where a mechanic could
turn into the thing the product opposes. Its parts live in `achievements/`:

It reads **real backend data**: `GET /achievements` through `@modules/gamification` (contract:
`backend-anti-aposta/docs/features/achievements.md`) and the support offer from `@modules/awareness`.
**Every figure and every award is the backend's** — the streak is derived there from the statement,
the badges are awarded there and never revoked, and reading the screen awards whatever fell due
since the last look. The views label and word; they decide nothing.

- `_streak.ts` is the streak shape the components render. `_achievements-view.ts` builds it from the
  backend's São Paulo day keys (labels, distances from today). `_streak-view.ts` holds the wording
  the dashboard's streak tile shares (`describeDays`, `describeStreakLength`).
- `_badge.ts` holds how each family is presented — label, mark, unit, where to check the figure,
  measured or self-reported — and carries the module's rules as comments. The catalogue itself
  (ids, thresholds, titles, criteria) is the backend's. `_badges-view.ts` words each badge's
  evidence and groups the cards.
- `_achievements-snapshot.ts` reads the backend once per request. `page.tsx` and
  `[family]/page.tsx` both read it, so a folder's count and the list behind it cannot disagree.
- **The badges are folded by family.** `/achievements` shows one `BadgeFamilyFolder` per family —
  its count, its latest earned badge (or, before one, the first with its distance) — linking to
  `/achievements/<slug>` (`streak`, `ceiling`, `reduction`, `savings`), which lists every badge of
  that family as `BadgeDialog` cards. A route rather than a sheet: it has a back button, and the
  cards open their dialog without stacking one modal on another. Folding hides nothing — every
  folder states how many badges it holds. An unknown slug is a 404.
- `_components/` holds the presentation. **The screen itself is entirely server-rendered** — the
  hero, the calendar strip, the streak list, the folders and the badge cards hold no state and ship no
  JavaScript of their own, which matters for an audience on cheap phones. The client half is only
  what has to be: `badge-dialog.tsx` (the detail popup each card opens), `badge-awarded-dialog.tsx`
  (the celebration, rendered by the layout’s `NotificationListener`) and `badge-medal.tsx` (the
  animated mark both share).

Rules this screen establishes:

- **Streaks are derived from the statement, never stored.** The dashboard used to hold
  `betFreeStreakDays: 3` by hand while the statement showed a bet that same day. A kept counter and
  the transactions it counts are two things that can disagree, and the one the user would believe is
  the counter. `/achievements` reads `gamification`'s `StreakRecord`, derived on the backend on every
  read; the dashboard's tile reads the same answer.
- **A bet-free day is a day we looked at and found nothing** — which only holds inside the window we
  have consent to read. So the window is part of the record, and the stretch that runs off its far
  edge reports **"pelo menos 33 dias"**, never 33. We know it ran at least that long; we have no
  right to say it started there. Any new figure that could be truncated says so the same way.
- **Today is not counted.** The streak holds complete days only. A screen that counted today would drop back to
  zero when a bet arrived in the evening, which is the one behaviour that would teach people to
  distrust it.
- **The hero is a count of days, and it is the only hero in the product that is not red.** Red means
  a gambling amount; a bet-free day is not one. It is not green either — `--spend-none` is reserved
  for a betting total of exactly zero, which is a different claim.
- **A zero reads as a zero.** The module requires a broken streak to be stated neutrally and the
  counter to restart: no sad copy, no warning colour, no "você perdeu sua sequência". The hero names
  the bet that ended it and the policy that caught it, then says when the count resumes — the same
  treatment a month past its ceiling gets.
- **Every badge marks something that happened, and none is ever revoked.** Nothing is awarded for
  opening the app, connecting an account or setting a goal. A badge records a fact, so taking it
  back when a streak breaks would be a punishment, and this product does not punish.
- **Nothing is hidden and nothing is random.** Every criterion is readable on the first visit. A
  badge revealed by chance is loot-box framing, which is the psychology the product exists to
  oppose — the same reason there is no padlock on an unearned badge and no greyed-out mystery card.
- **There are no points, levels or rankings, and the screen says so.** SDT asks a mechanic to
  support competence, not to replace it with a score; a number that exists only to go up is the
  extrinsic motivator it warns about, and a leaderboard would turn a private financial difficulty
  into a comparison with other people. Relatedness is **absent on purpose** — the module reserves
  shareable achievements for later and always opt-in, so there is no share affordance rather than
  one that pretends.
- **A distance is a distance.** `NextMilestoneCard` and every unearned badge state what is left in
  units and stop. No "quase lá", no countdown, nothing that animates, nothing that teases. A
  near-miss is the precise effect a slot machine sells.
- **Self-reported badges cannot look measured.** The savings family is the one fed by figures the
  user typed in, so its cards and its family heading both say "registrado por você". Letting the two
  kinds look identical would lend the self-reported half a certainty it has not got — the same
  distinction `/goals` keeps between a savings goal and the ceiling.
- **Closed months only.** The open month is half a month: a badge awarded on it could be undone by
  its last ten days.
- **The calendar strip is retrospective and nothing else.** One square per day, oldest left, today
  ringed. The two fills are separated by **lightness**, not hue, so they survive every form of
  colour blindness and both themes; the legend names both states, each square carries its date and
  state in a `title`, and the same facts are in the sr-only summary and the streak list — which is
  what lets the grid itself be `aria-hidden` instead of read out as sixty list items.
- **Every card opens a dialog, and the two dialogs are not the same thing.** `BadgeDialog` is a
  record the reader asked for: the criterion, what satisfied it or how far it stands, and a link to
  the screen the figure came from. `BadgeAwardedDialog` is the celebration, and only a
  `BadgeAwarded` notification opens it.
- **The confetti fires on the award and nowhere else.** Opening `/achievements` celebrates nothing,
  however many badges are on it — a burst for something that happened three weeks ago is applause
  for nothing having occurred, and it would teach the reader that the celebration means nothing.
  Firing it beside an **unearned** badge would be the near-miss the rules forbid outright. The burst
  is `MilestoneConfetti`, the same one a reached savings goal uses, and it is created in the
  notification handler — never during render, where `Math.random()` is impure.
- **A badge is rare, which is what earns it the interruption.** Eleven exist. A modal for something
  that fired weekly would be the harassment the notifications module forbids, and a `StreakBroken`
  modal would be the product scolding somebody — that one stays a toast, permanently.
- **`BadgeMedal` names its three entrances** (`CELEBRATE`, `SETTLE`, `NONE`) rather than taking a
  flag, because how the mark arrives is the whole of what the component does. The celebration halo
  **plays once**: a mark that keeps pulsing is an attractor built to pull the eye back, which is a
  slot-machine technique in a celebration's clothes. `NONE` is what reduced motion gets, and it is
  the same final state with the travel removed (WCAG 2.3.3).
- **Motion propagates a variant label through its own components only.** The staggered lines in the
  celebration are direct `motion` children of the stagger container: a plain `div` between them — a
  `DialogHeader`, in the version that shipped first — cuts the chain silently, and every line then
  appears at once with no animation and nothing in the console to say so.
- **Nothing is revealed.** No padlock, no scratch-off, no "spin to see what you won". Every
  criterion is plain text on the screen before, during and after.
- **The support offer outranks the whole screen.** See below.

## The escalation path

The root `CLAUDE.md` requires that sustained betting surfaces support resources rather than more
gamification. `SupportCard` on `/transactions/insights` is that path, and the rules it sets:

- **The trigger is conservative on purpose, and the backend owns it.** `awareness.SupportOffer`
  (`GET /awareness/support-offer`, read by `/transactions/insights`) needs three consecutive whole
  months in the high band, and sends the threshold the copy names; `/achievements` reads the same
  answer. `_support-signal.ts` is only the shape `SupportCard` renders. A failed read renders
  no card — never an error in its place. A missed offer costs one screen; a false one tells somebody they may
  have a problem they do not have, from an app that has only seen their bank statement. New
  signals get their negative cases tested first.
- **It reports what it counted and stops.** No diagnosis, no advice, no "você está gastando
  demais". The copy names the months and the threshold; what that means is not the app's call.
- **It is never styled as an alarm.** No red, no urgency, no animation. Red means a gambling
  amount here; borrowing it to raise the temperature is the manufactured alarm the product rules
  forbid. It reads as an offer because that is what it is.
- **It renders on the server and hides after hydration** if dismissed — never the reverse. A
  support line that waits for JavaScript is one some people never see.
- **Dismissal lasts the session, not forever** (`sessionStorage`). Autonomy is the point of the
  SDT framing, but a permanent hide would bury a crisis line behind one stray click.
- **It renders on `/achievements` too, above everything, and it suppresses `NextMilestoneCard`
  there.** The product rule is support resources *instead of* more gamification, and that screen is
  the gamification. The badges stay — removing a record of something the person did would be a
  punishment — but the nudge toward the next milestone stops while the offer stands, and somebody
  who needs a phone number does not scroll past a progress bar to reach it. The dismissal is shared
  with `/transactions/insights`: one offer, dismissed once.
- **The contacts live in `@shared/ui/support-contacts`**, rendered by both the marketing footer and
  this card. A support number that goes stale in one copy is a harm, not a style inconsistency —
  never inline them again.

## `/transactions/insights` — the charts

Transações is two pages behind one sidebar entry, switched by `SectionTabs`. A nav entry owns its
sub-routes (`isCurrentSection` in `app-sidebar.tsx`), so the section stays highlighted.

It reads `GET /transactions/monthly-summary` (twelve months, São Paulo calendar months, betting
following the **classification** rather than the category, so a correction leaves the series).
`_insights-view.ts` labels the months on the server and holds the reader's choices:

- **A month with no data is absent, not zero.** The backend omits it, and so does the chart; the
  hero says how many of the window's months have data. Twelve zero bars would read as "you have
  never bet".
- **`TOTAL_SPENT` is the one sum computed here** — every category except `INCOME`. The backend
  sends only the parts, so a total it sent could never disagree with them.
- **The open month is half a month.** It is a bar, marked "em andamento" in the tooltip, but the
  average is over **whole** months only; with none yet, the hero says so instead of averaging.

Charts are Recharts via the shadcn `chart` primitive. The rules that produced this screen:

- **One series at a time, one axis.** The reader picks the metric; the chart never plots two
  measures together. A dual-axis chart invents a correlation that is not in the data, and two
  series would need a categorical palette this product does not have.
- **No legend for a single series** — the card title already names what is plotted.
- **The betting series is the only one whose colour *encodes* anything**, banded by
  `_spend-level.ts`. Everything else uses `--chart-2`, a step of the brand ramp held at low chroma
  so it belongs to the product without reading as a signal. It is deliberately below the
  categorical chroma floor: it marks a series, it does not identify one.
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

## `/dashboard` — Início, a summary of the other screens

It owns **no figure**. `_dashboard-snapshot.ts` makes five reads in parallel — `/bets/summary?days=30`,
`/achievements`, `/betting-ceiling`, the newest statement rows and `/accounts` — and each card is
another screen's answer from that screen's own endpoint, so the two cannot disagree.

- **The hero is the last 30 days, not the calendar month.** It is `/bets` over its shortest window,
  to the cent, and "Ver detalhes" opens `/bets?period=30`. A calendar month would drop to zero on
  the first and make a "vs last month" delta compare half a month with a whole one, so there is no
  delta. The goal card *is* a calendar month, because that is what a ceiling governs, and names the
  month to say so.
- **The betting summary gates the screen.** `NO_CONSENT`, `SYNCING` or a failure renders one
  `StatementUnavailable` under the greeting, never five cards reading R$ 0,00. Once it is ready, the
  other reads degrade **per card** — a failed streak, goal or list says so in place.
- **There is no balance tile.** No endpoint serves balances: Open Finance shares a statement here,
  and detection does not need one (data minimisation). The second tile is the share of income
  (`incomeShare`, same window, uncapped, stated without comment).
- **The streak tile says "pelo menos"** when the current stretch runs off the window, like
  `/achievements`.
- Reading `/achievements` awards what fell due, so a badge can be celebrated from here — over the
  stream, as anywhere else.

## Dashboard conventions

- **Exactly one hero figure per view** (≥48px). On the dashboard it is the betting spend over the
  last 30 days, in red — that is the number the product exists to confront the user with, and the
  12-month yield equivalent sits directly beside it, labelled as an estimate with its rate stated.
- Stat tiles carry label (sentence case) · value · one line of detail. Deltas are signed and named
  against a period, and take red only when the direction is genuinely bad.
- `tabular-nums` belongs in columns of numbers (transaction rows), never on the hero figure, where
  it makes digits look loose.
- Every betting row shows the `Aposta` badge and how it was detected (`MCC 7995`, CNPJ) — the user
  is owed the reason, and it is what makes the classification auditable.
- Copy stays retrospective and non-judgemental. No screen may imply the platform could have
  blocked a transaction.
