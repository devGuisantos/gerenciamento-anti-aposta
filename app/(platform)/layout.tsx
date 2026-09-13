import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeToggle } from '@shared/ui/theme-toggle';

import { AppSidebar } from './_components/app-sidebar';
import { NotificationListener } from './_components/notification-listener';

export default function PlatformLayout({ children }: LayoutProps<'/'>) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          {/*
           * On mobile the sidebar becomes a slide-over sheet; this trigger is the
           * only way to reach it, so it stays visible at every width.
           */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <SidebarTrigger />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Voltar ao site</span>
            </Link>
            <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
              Dados simulados
            </span>
            <ThemeToggle />
          </header>

          <div className="flex-1">{children}</div>

          {/* Nudges and achievements arrive here from the SSE stream. */}
          <NotificationListener />
          <Toaster position="bottom-right" />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
