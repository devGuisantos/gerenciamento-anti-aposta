import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { RegisterForm } from '../_components/register-form';

export const metadata: Metadata = {
  title: 'Criar conta',
  description:
    'Crie sua conta e descubra quanto as apostas online já custaram ao seu orçamento.',
};

/** The page stays a Server Component; everything interactive is in `RegisterForm`. */
export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>
          Leva menos de dois minutos. A conta bancária você conecta depois, quando quiser.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
