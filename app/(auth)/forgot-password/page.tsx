import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { ForgotPasswordForm } from '../_components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Receba um link para redefinir a senha da sua conta.',
};

/** The page stays a Server Component; everything interactive is in the form. */
export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe o e-mail da conta e enviaremos um link para você criar uma senha nova.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ForgotPasswordForm />

        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
