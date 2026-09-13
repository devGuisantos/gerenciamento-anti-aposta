'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * shadcn ships the `.dark` tokens and the `dark:` variant but no switching
 * mechanism; `next-themes` is the piece that toggles the class on <html> and
 * writes the choice to localStorage before first paint.
 */
export function ThemeProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
