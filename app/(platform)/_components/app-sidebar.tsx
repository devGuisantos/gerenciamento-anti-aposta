'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  Settings,
  Target,
  Trophy,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@shared/ui/logo';

import { signOutAction } from '../_sign-out-action';

type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: typeof LayoutDashboard;
};

type NavGroup = {
  readonly label: string;
  readonly items: readonly NavItem[];
};

/** Each entry maps to a bounded context in `src/modules`. */
const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Visão geral',
    items: [
      { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
      { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
      { href: '/bets', label: 'Apostas', icon: ScanSearch },
    ],
  },
  {
    label: 'Progresso',
    items: [
      { href: '/goals', label: 'Metas', icon: Target },
      { href: '/achievements', label: 'Conquistas', icon: Trophy },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/accounts', label: 'Contas conectadas', icon: Landmark },
      { href: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

/**
 * A nav entry owns its sub-routes: `/transactions/insights` is still Transações,
 * and an exact match would leave the whole sidebar unhighlighted while the reader
 * is plainly inside a section.
 */
function isCurrentSection(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  readonly userName: string;
  readonly userEmail: string;
};

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  /* Collapsed to icon width, only the mark fits. The mobile sheet is full width,
     so it keeps the wordmark. Driven by state rather than a CSS variant, which
     is easier to follow and cannot silently stop matching. */
  const isIconOnly = state === 'collapsed' && !isMobile;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 items-start justify-center px-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Logo showText={!isIconOnly} />
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isCurrentSection(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {/* Not a button: there is nothing to do by clicking who you are. */}
          <SidebarMenuItem>
            <div className="flex h-12 items-center gap-2 overflow-hidden p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-1">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium"
              >
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="grid min-w-0 text-left leading-tight">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* A form, so signing out works before hydration and is a POST, never a GET a prefetch could trigger. */}
            <form action={signOutAction}>
              <SidebarMenuButton type="submit" tooltip="Sair">
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
