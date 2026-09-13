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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Criar conta · anti-aposta",
  description:
    "Crie sua conta e descubra quanto as apostas online já custaram ao seu orçamento.",
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>
          Leva menos de dois minutos. Você conecta a conta bancária depois.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* TODO(identity): wire to the RegisterUser use case through a Server Action. */}
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Como podemos te chamar"
              className="h-10"
              required
            />
          </div>

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
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              className="h-10"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">Confirmar senha</Label>
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              className="h-10"
              minLength={8}
              required
            />
          </div>

          <div className="flex items-start gap-3 pt-1">
            <Checkbox id="terms" name="terms" className="mt-0.5" required />
            <Label
              htmlFor="terms"
              className="items-start text-sm leading-relaxed font-normal text-muted-foreground"
            >
              Li e aceito os termos de uso e a política de privacidade, incluindo o tratamento
              dos meus dados conforme a LGPD.
            </Label>
          </div>

          <Button type="submit" size="lg" className="h-10 w-full">
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
