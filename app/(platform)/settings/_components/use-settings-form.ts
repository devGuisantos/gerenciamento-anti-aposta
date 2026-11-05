'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { INITIAL_AUTH_FORM_STATE, type AuthFormState } from '@/app/(auth)/_auth-form-state';

import type { SettingsActionResult } from '../_actions';

type SettingsForm = {
  readonly form: AuthFormState;
  readonly isSaving: boolean;
  readonly submit: (event: React.FormEvent<HTMLFormElement>) => void;
};

/**
 * Submits through `onSubmit` rather than `<form action>`, because React resets an
 * uncontrolled form once its action settles: a refused change would clear what
 * the person typed. The screen changes only on the backend's answer.
 */
export function useSettingsForm(
  action: (formData: FormData) => Promise<SettingsActionResult>,
  onSaved?: (form: HTMLFormElement) => void,
): SettingsForm {
  const [form, setForm] = useState<AuthFormState>(INITIAL_AUTH_FORM_STATE);
  const [isSaving, startSaving] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const element = event.currentTarget;
    const formData = new FormData(element);

    startSaving(async () => {
      const result = await action(formData);

      if (result.status === 'FAILED') {
        setForm(result.form);

        return;
      }

      setForm(INITIAL_AUTH_FORM_STATE);
      toast.success(result.message);
      onSaved?.(element);
    });
  }

  return { form, isSaving, submit };
}
