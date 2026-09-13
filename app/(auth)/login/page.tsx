import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Entrar · anti-aposta",
  description: "Acesse sua conta para acompanhar seus gastos com apostas.",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para continuar acompanhando seus gastos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* TODO(identity): wire to the SignIn use case through a Server Action. */}
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10"
              required
            />
          </div>

          <Button type="submit" size="lg" className="h-10 w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
