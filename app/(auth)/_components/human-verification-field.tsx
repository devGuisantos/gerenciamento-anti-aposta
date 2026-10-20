'use client';

import Script from 'next/script';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useTheme } from 'next-themes';
import { CircleAlert } from 'lucide-react';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** The backend's field name; the widget writes its token into a hidden input of this name. */
export const HUMAN_VERIFICATION_FIELD = 'humanVerificationToken';

const LOAD_FAILED_MESSAGE =
  'A verificação de segurança não carregou. Recarregue a página e tente de novo.';

type TurnstileRenderOptions = {
  readonly sitekey: string;
  readonly action: string;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: string;
  readonly size: 'flexible';
  readonly 'response-field-name': string;
  readonly callback: () => void;
  readonly 'error-callback': () => void;
};

type TurnstileApi = {
  render(container: HTMLElement, options: TurnstileRenderOptions): string | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type HumanVerificationHandle = {
  /** A token is single-use: every submit spends it, so the next one needs a fresh one. */
  readonly reset: () => void;
};

type HumanVerificationFieldProps = {
  readonly siteKey: string;
  readonly ref?: Ref<HumanVerificationHandle>;
};

/**
 * Cloudflare Turnstile, on `/register` only. Most people never see a puzzle: it
 * decides in the background and shows a small "Sucesso". Rendered explicitly so
 * a remount after navigation does not leave a second widget behind.
 *
 * The token reaches the Server Action through the form itself — a hidden input
 * named `humanVerificationToken` — so `new FormData(form)` already carries it.
 * The backend verifies it; nothing here decides anything.
 */
export function HumanVerificationField({ siteKey, ref }: HumanVerificationFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : 'auto';

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current !== null) {
        window.turnstile?.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    const container = containerRef.current;

    if (!isScriptReady || container === null || window.turnstile === undefined) {
      return;
    }

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: 'register',
      theme,
      language: 'pt-br',
      size: 'flexible',
      'response-field-name': HUMAN_VERIFICATION_FIELD,
      callback: () => setHasFailed(false),
      'error-callback': () => setHasFailed(true),
    });
    widgetIdRef.current = widgetId ?? null;

    return () => {
      if (widgetId !== undefined) {
        window.turnstile?.remove(widgetId);
      }
      widgetIdRef.current = null;
    };
  }, [isScriptReady, siteKey, theme]);

  return (
    <div className="space-y-2">
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
        onError={() => setHasFailed(true)}
      />
      <div ref={containerRef} className="min-h-16.25" />
      {hasFailed ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {LOAD_FAILED_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
