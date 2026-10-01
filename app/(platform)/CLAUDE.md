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
TCC) and so does an awarded badge (`BadgeAwardedDialog`, with confetti), while a broken streak and a
reached savings goal are toasts. That split is a product decision rather than a styling one — see
`/achievements` below, and the notifications module’s own rules. Publishing reaches every connected browser, not one user — fine
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
- **The correction button is an affordance, not a feature.** `ReclassifyAction` in the transaction
  detail says on click that it changes nothing, and its TODO names the command, the event, and
  everything that has to recompute when it lands. Never let it fake a success state: somebody who
  believes they corrected a number that is still wrong is worse off than with no button.
- **Uncertainty is visible.** A `LOW`-confidence match renders "Possível aposta" in an outline
  badge, never the flat "Aposta" — `bet-detection` reports the lowest confidence of the policies
  that agreed, and the UI must not launder that into a certainty.
- **Accounts are told apart by shape and by words, never by colour.** The palette is monochrome, so
  a row stamps its account kind onto the category glyph (`EntryAvatar`) and names the account in
  the subtitle; the marker is `aria-hidden` because the text already carries it. Shape does not
  scale past a handful of accounts — if a third arrives, the words stay and the badge gives way.
- **Account numbers are masked at the fixture**, never in the component. Only the last four digits
  exist in the app, so there is nothing to leak into a log or an RSC payload.
- **The fixtures agree per calendar month, not per rolling window.** This month's ledger entries
  are authored; earlier months' bets are generated from `insights/_mock-monthly-history.ts`, and
  each month sums to that month's figure. A "últimos 30 dias" total therefore reads higher than the
  dashboard's "neste mês", because it reaches into the previous month — that is correct, and the
  labels say which is which. The fixture also holds exactly the two accounts the snapshot counts.
- `SelectValue` needs **explicit children**. Radix fills it from the selected item, and items only
  register once the portal opens — leave it empty and the trigger renders blank on the server.

## `/bets` — the consumption reframing

`AccumulatedCost` carries two reframings of the same total: fixed income answers "what would it
have become", the `SpendingEquivalences` carousel answers "what would it have bought".

- **Quantities are divided out of the real total, never written down.** An item the amount does not
  cover is not shown. "1 carro" beside R$ 2.320,00 would discredit every other figure on the page.
- **Two sources, kept apart.** Months of the reader's own grocery or rent bill come first and
  invent nothing — the unit price is their own average and the detail line says so. The object
  prices in `_equivalences.ts` are rounded estimates for the demo, which is why the card calls them
  approximate. They belong in configuration before this is defensible.
- **Auto-advance needs an off switch.** WCAG 2.2.2: anything moving on its own past five seconds
  must be pausable. It stops on hover, on keyboard focus, and on a visible button, and never starts
  for `prefers-reduced-motion`.

## `/goals` — two kinds of goal, deliberately kept apart

The screen carries two things the user calls a meta, and they are **known in completely different
ways**. Saying which is which is the screen's main job:

| | Savings goals | Betting ceiling |
| --- | --- | --- |
| Source | the user records it | measured from transactions we read |
| Files | `_savings-goal.ts`, `_savings-goals-store.ts`, `_actions.ts` | `_goal.ts`, `_mock-goals.ts` |
| Can be wrong because | the user forgot to log a deposit | the classifier missed a bet |

Never merge them into one figure, and never let savings copy borrow the certainty the ceiling has.

## `/goals` — savings goals

Self-reported, and every screen says so. Open Finance shows a statement; it does not show that a
transfer was *meant* as savings and never sees cash in a drawer. So the user records the movements
and the app keeps the ledger — the honest version of a savings goal.

- **The balance is summed from the movements, never stored.** A kept total and a list that
  disagree would have the user believing the total, which is the one that would be wrong.
- **The history is not a nice-to-have.** A balance with no history is an assertion: somebody who
  logged the wrong amount has nothing to check against, and this is a number they are trusting us
  to keep. It lives behind a dialog so the cards stay scannable on a phone.
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
  *crosses* a target the user set. The store decides that — `reachedNow`, a before/after
  comparison, standing in for the `GoalReached` event — and the client never infers it, because a
  celebration the browser talked itself into is a celebration for something that may not have
  happened. What follows from the rules, and must not be "improved" later:
  - No confetti on a deposit that does not finish the goal. Applause for participation is the
    same bin as a badge nobody earned.
  - No confetti on a deposit into an already-finished goal, and none on any withdrawal.
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
- **Server Actions are public POST endpoints and these have no caller check yet.** Each one carries
  a `TODO(identity)` naming `requireSession()`; the store holds one shared set of goals because
  there is no user to key them by. Safe on a demo laptop, not shippable. The Zod parse is not the
  missing part — that is there, and an action re-checks every bound the form already enforced.
- `_savings-goals-store.ts` is an in-process stand-in with the same limitations
  `notifications/infrastructure/demo-broker.ts` documents: one Node process, no restart survival,
  reset by an edit in `next dev`. The over-withdrawal check in it is an **aggregate invariant**
  wearing a store's clothes — it moves into `Goal` with its negative case tested first.

## `/goals` — the betting ceiling

A goal here is a **monthly ceiling on betting spend**, plus what the user said the money is for.
Both halves come from them, which is the autonomy half of the SDT mapping; the months behind them
are the competence half. Its parts live in `goals/`:

- `_goal.ts` is the ceiling shape, mirroring `gamification`'s `Goal`. It carries the month it was
  set in and the month it was replaced, so the ceiling can change without rewriting history.
- `_goals-view.ts` derives the monthly outcomes and holds the simulation. Pure, and it takes its
  months as an argument — `page.tsx` is the only file that knows where the numbers come from.
- `_mock-goals.ts` holds two goals rather than one, because the user changed their mind.

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
  ceiling tried. There is deliberately **no month-end projection** — the fixture's current month
  is a whole-month figure, so a pace estimate would be a fixture artefact wearing a forecast's
  clothes. Days remaining is a fact and says enough.
- **The simulator answers in counts and differences, never in advice.** It does not recommend a
  value and it does not claim the money would have gone somewhere better — the person may well
  have spent it on something else, and a screen that pretends otherwise sells a regret instead of
  reporting a number. It changes nothing until `SetCeilingAction` lands; that button says so.
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

- `_streak.ts` is the streak shape, mirroring `gamification`'s `Streak`. `_streak-view.ts` derives
  every streak from the ledger and holds the arithmetic.
- `_badge.ts` is the catalogue — titles, criteria, thresholds — and carries the module's rules as
  comments where the data is. `_badges-view.ts` evaluates it against what was observed.
- `_components/` holds the presentation. **The screen itself is entirely server-rendered** — the
  hero, the calendar strip, the streak list and the badge cards hold no state and ship no
  JavaScript of their own, which matters for an audience on cheap phones. The client half is only
  what has to be: `badge-dialog.tsx` (the detail popup each card opens), `badge-awarded-dialog.tsx`
  (the celebration, rendered by the layout’s `NotificationListener`) and `badge-medal.tsx` (the
  animated mark both share).

Rules this screen establishes:

- **Streaks are derived from the statement, never stored.** The dashboard used to hold
  `betFreeStreakDays: 3` by hand while the statement showed a bet that same day. A kept counter and
  the transactions it counts are two things that can disagree, and the one the user would believe is
  the counter. Both screens now read `toStreakRecord`, and the fixture fields are gone.
- **A bet-free day is a day we looked at and found nothing** — which only holds inside the window we
  have consent to read. So the window is part of the record, and the stretch that runs off its far
  edge reports **"pelo menos 33 dias"**, never 33. We know it ran at least that long; we have no
  right to say it started there. Any new figure that could be truncated says so the same way.
- **Today is not counted.** The module extends a streak on the daily clock tick, which fires when a
  day ends, so the counter holds complete days only. A screen that counted today would drop back to
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

- **The trigger is conservative on purpose.** `_support-signal.ts` needs three consecutive whole
  months in the high band. A missed offer costs one screen; a false one tells somebody they may
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
