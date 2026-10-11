import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { SignInForm } from '../_components/sign-in-form';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta para acompanhar seus gastos com apostas.',
};

/** The page stays a Server Component; everything interactive is in `SignInForm`. */
export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para continuar acompanhando seus gastos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SignInForm />

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
