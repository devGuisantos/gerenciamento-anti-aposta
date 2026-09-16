'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
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

export function AppSidebar() {
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
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Conta de demonstração">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
                G
              </span>
              <span className="grid text-left leading-tight">
                <span className="truncate text-sm font-medium">Conta demo</span>
                <span className="truncate text-xs text-muted-foreground">
                  dados simulados
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
