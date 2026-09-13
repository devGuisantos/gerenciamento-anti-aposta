# `app/(auth)/` — login and register

Two screens sharing a centred single-card layout (`max-w-sm`), with the logo and a way back to the
landing page. Nothing else: no marketing, no statistics, no nudge. A person signing in is already
convinced.

## Current state

The forms are **UI only** — no `action` is wired, because the `identity` module does not exist
yet. Each carries a `TODO(identity)` comment naming the use case that will own it. Do not stub a
fake authentication flow to make them "work"; wire them to the real use case when it lands.

## Wiring the forms (when identity exists)

- One Server Action per screen in `app/(auth)/actions.ts`, marked `"use server"`.
- The action parses `FormData` with a Zod schema, calls `container.registerUser` /
  `container.signIn`, and maps the `Result` to a message — it never hashes a password, checks a
  credential, or touches Prisma itself.
- **Re-authorise inside the action.** Server Actions are public POST endpoints.
- Never echo back which half of a credential pair was wrong ("e-mail não encontrado" tells an
  attacker the address exists). One message: "E-mail ou senha incorretos."
- Rate limiting belongs in `proxy.ts` or the use case, not in the component.
- On success, `redirect('/dashboard')`; never return the session token to the client.

## Form conventions

- Every field: `<Label htmlFor>`, matching `id`/`name`, an `autoComplete` value
  (`email`, `current-password`, `new-password`, `name`), and native validation (`required`,
  `minLength={8}`).
- Inputs and the submit button get `className="h-10"` — the default `h-8` is too small for a
  primary form.
- Register requires an explicit LGPD consent checkbox. It is never pre-checked, and the label
  states what is being consented to.
- Errors render next to their field with `aria-invalid` on the input, not as an alert at the top.
- Password visibility toggles, strength meters, and anything else interactive go in a small
  `"use client"` component — the pages themselves stay server-rendered.
