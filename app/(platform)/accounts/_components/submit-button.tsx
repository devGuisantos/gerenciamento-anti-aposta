'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

type SubmitButtonProps = {
  readonly children: React.ReactNode;
  readonly pendingLabel: string;
};

/**
 * The submit for a server-rendered `<form action>`: it works before hydration,
 * and once hydrated it says the request is on its way, so nobody presses
 * "Conectar" twice and opens two consents.
 */
export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
