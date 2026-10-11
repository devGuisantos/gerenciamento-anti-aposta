# `app/(auth)/` — login, register, password recovery

Three screens sharing a **two-column layout**: context on the left at roughly two thirds, the form
card on the right at a fixed `22rem`. On mobile it collapses to one column with the card on top —
the person came to fill in a form, not to read.

The card column is fixed rather than fractional because a form has a width below which it stops
being comfortable, and a percentage would go under it on a 1280px laptop.

```
app/(auth)/
  layout.tsx                 # two-column shell, theme toggle, disclaimer + support line
  actions.ts                 # signInAction, registerAction — the Server Actions
  _auth-form-state.ts        # backend failure -> form-level message + per-field errors
  _password-strength.ts      # the pure assessment policy
  _components/
    auth-aside.tsx           # the context column (nothing focusable — see below)
    auth-text-field.tsx      # name / e-mail, with the mobile keyboard fixes
    password-field.tsx       # label, input, visibility toggle, hint, optional meter
    password-strength-meter.tsx
    consent-field.tsx        # the LGPD checkbox
    sign-in-form.tsx
    register-form.tsx
    forgot-password-form.tsx
    form-failure-notice.tsx  # a failure that belongs to the form, not to one field
    pending-form-notice.tsx  # what forgot-password says instead of sending anything
  login/ register/ forgot-password/
```

## Current state

**Sign-in and registration are live** against backend-anti-aposta (`POST /identity/sessions`,
`POST /identity/users`), through the Server Actions in `actions.ts`. **`/forgot-password` is still
UI only**: the backend does not build the reset-request endpoint yet (it needs a mail provider), so
that form keeps its `TODO(identity)` and its `PendingFormNotice`. Do not stub a fake flow for it.

- **`/forgot-password` is where faking would do the most harm.** "Enviamos um e-mail" when nothing
  was sent leaves somebody waiting on a message that never comes, checking spam, locked out. Its
  notice says in as many words that no e-mail was sent. `PendingFormNotice` is inline, not a toast,
  and not styled as an error — nothing the person did was wrong.
- **There is no anonymous way into the app.** The "Entrar na demonstração" button was removed when
  the platform routes became session-gated: it would only have bounced back here. A signed-in
  account still sees simulated data until Open Finance is wired.

## The context column

`AuthAside` explains the product beside the form. It is not the landing page in miniature, and the
limits on it are what keep it from becoming one.

- **It carries no focusable element, and that is load-bearing.** The card is first in the DOM so a
  keyboard or screen-reader user reaches the form before the prose, while the grid places the aside
  to its left. A visual order that differs from the DOM order is only safe while nothing in the
  aside can be tabbed to — put a link there and the tab order starts jumping backwards across the
  screen. Anything interactive belongs in the card.
- **No national statistics**, even the sourced ones from the landing page. Leading with "56% dizem
  que o dinheiro faz falta" builds a case against the reader before they have been offered
  anything, which is the mistake `SupportCard` documents and avoids. The landing page is where the
  argument belongs; by the time somebody is at the door they have heard it.
- **No urgency and no social proof.** No counters, no "junte-se a X pessoas", no testimonials.
- **The limits are repeated here on purpose.** `#limites` is mandatory on the landing page, and
  this is the last screen before somebody hands over financial data — the right moment to say
  plainly what will not happen with it.
- The headline figures are the arithmetic the product itself uses: R$ 500,00 at the 11,4% a.a. that
  `FIXED_INCOME_ANNUAL_RATE` carries is R$ 557,00 in twelve months. Change the rate, change the
  line.

## The forms are Client Components, and the reason is a bug

A `<form>` with no `action` falls back to **GET against the current URL** — which puts the password
in the address bar, in browser history, and in every access log between the browser and the server.
That is what these screens did before `sign-in-form.tsx` existed, and it is the kind of bug that
survives review because the screen looks right.

So each form is a Client Component whose `onSubmit` calls `preventDefault`. Use `preventDefault`,
**never `type="button"` on the submit**: the browser then still runs native validation first, so an
empty field gets "preencha este campo" before anything is sent.

The handler then builds the `FormData` and calls the `useActionState` dispatcher inside
`startTransition`, **rather than passing the action to `<form action>`**. React resets a form after
an `action` completes, which would wipe the e-mail somebody just typed every time the password was
wrong.

The pages themselves stay Server Components and render one form component each.

## Wiring the forms

- One Server Action per screen in `app/(auth)/actions.ts`, marked `"use server"`.
- The action parses `FormData` with a Zod schema (**shape only**), calls `registerUser` / `signIn`
  from `@modules/identity`, and maps the result to an `AuthFormState`. It never hashes a password
  or checks a credential: backend-anti-aposta is the system of record and re-checks the password
  match, the consent and the length policy. Repeating those rules here would only let two copies
  drift; the client-side checks in `RegisterForm` exist to save a round trip, not to authorise.
- **Errors go where the backend anchors them.** `details.field` puts the message under that field;
  a `details` map of field → message puts each under its field; anything else is form-level, in
  `FormFailureNotice`. Field names are the backend's (`acceptedRegistrationConsent` is the consent).
- Never echo back which half of a credential pair was wrong ("e-mail não encontrado" tells an
  attacker the address exists). One message: "E-mail ou senha incorretos."
- **Password recovery answers identically whether or not the address exists.** A different message
  for an unknown e-mail turns that form into a way to enumerate the platform's users — which for
  this product is a list of people who may be gambling. Reset tokens are single-use, short-lived,
  and never logged.
- Rate limiting belongs to the backend, never to the component.
- On success, `storeSession` then `redirect('/dashboard')`; never return the session token to the
  client.

## Form conventions

- Every field: `<Label htmlFor>`, matching `id`/`name`, an `autoComplete` value, and native
  validation (`required`, `minLength`). Ids come from `useId()` inside the field component — a
  hand-written id is an id that collides the day a field appears twice.
- Inputs and the submit button get `className="h-10"`; the default `h-8` is too small for a
  primary form.
- **Requirements are hints with `aria-describedby`, never placeholders.** A placeholder disappears
  the moment somebody types, sits at low contrast while it is there, and is not reliably announced,
  so a rule that lives only in one is a rule the user meets by accident.
- **The mobile keyboard attributes are not polish.** `FIELD_BEHAVIOUR` in `auth-text-field.tsx`
  sets `autoCapitalize`, `autoCorrect`, `spellCheck` and `inputMode` per field kind in one place.
  Android capitalises the first letter of every field by default, so an untouched e-mail box offers
  "Voce@exemplo.com" and the sign-in fails for a reason the person cannot see. This audience is on
  cheap phones, and a login that fails once is a login somebody does not try twice.
- Errors render next to their field with `aria-invalid` on the input, not as an alert at the top.
- Password visibility toggles, strength meters, and anything else interactive live in
  `_components/` with `"use client"`.
- **The visibility toggle is `type="button"`.** A button inside a form submits it by default, which
  here would send the form on every reveal. It carries `aria-pressed` and `aria-controls`, and its
  label switches between "Mostrar senha" and "Ocultar senha".

## `PasswordField` — controlled only where the value is needed

`meter` is a union (`'NONE' | 'STRENGTH'`) and it decides both halves: a `STRENGTH` field must be
controlled, because a meter cannot assess a value it cannot see, and the prop types refuse a meter
with nothing to measure.

The **sign-in field is uncontrolled on purpose**. A password manager fills it through the DOM, and
the fewer round-trips between the browser's autofill and React's idea of the value, the fewer ways
that can go wrong on the one screen whose whole job is letting somebody in. Controlled/uncontrolled
is fixed per call site, so React never has to switch modes.

## The strength meter

- **Advice, never a gate.** `minLength={8}` is the only hard rule. A meter that refused to let
  somebody continue would lock people out of their own finances over a judgement about a passphrase.
- **Length outranks character variety**, and `_password-strength.ts` says why: "Tr0ub4dor&3" is the
  password everybody was taught to write and it is weaker than four ordinary words. The variety
  rules were designed around what a human finds hard to remember, not what a machine finds hard to
  guess. `Password1` scores **weak** here, which is the whole point of having the policy.
- **Monochrome, and that is not a limitation.** The usual meter runs red to green and neither
  colour is available: red in this product means a gambling amount, and spending it on a weak
  password would cost the one signal that carries meaning. Filled segments of `bg-foreground` plus
  the label in words — which is what a colour-blind reader needed anyway.
- One suggestion at a time, the one with the most to gain. A list of five things to fix reads as a
  telling-off and gets ignored whole.
- The live region is `aria-live="polite"`. Assertive would interrupt the person on every keystroke.

## Consent

- **The label names what is being consented to.** "Li e aceito os termos de uso e a política de
  privacidade" was the wording here, and in this repository those documents do not exist — a
  tick-box consenting to nothing in particular is a dark pattern, and this product handles the most
  sensitive category of personal data there is.
- **It says that registration reads no bank data.** That needs a separate Open Finance consent with
  its own scope and expiry, approved on its own screen and revocable, as the root `CLAUDE.md`
  requires. Somebody who believed they had just handed over account access would be wrong, and
  would be right to be angry.
- It is never pre-checked, and it is validated in the submit handler rather than with a native
  `required`: Radix renders the real checkbox hidden, and a hidden required control makes Chrome
  refuse the submit with nothing visible to the user.

## The support line in the footer

`layout.tsx` carries **CVV 188** under the academic disclaimer. The root `CLAUDE.md` requires an
escalation path and the marketing footer covers visitors, but these two screens are exactly where a
person is stuck at a door and may be in crisis. One line, no framing, no appeal — it is not
marketing, and it is the one thing on these screens that outranks "nothing else".
