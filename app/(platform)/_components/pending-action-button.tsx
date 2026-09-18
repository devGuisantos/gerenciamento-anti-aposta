'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from 'cn';

type PendingActionButtonProps = {
  readonly children: React.ReactNode;
  /** Says what would happen once the module lands, and that nothing happened now. */
  readonly pendingMessage: string;
  readonly className?: string;
};

/**
 * A control for something the modules do not do yet.
 *
 * It exists so the screens can be designed and demonstrated whole, and it has one
 * rule: **it never fakes success**. Pressing it raises a toast saying plainly that
 * nothing changed. A button that swallows the click in silence leaves somebody
 * believing they corrected a number, or set a goal, that does not exist — and in
 * this product those are the numbers they are trying to face.
 *
 * The message goes to the toaster rather than inline because these buttons sit in
 * narrow cards: replacing the button with two or three lines of text made the card
 * jump and pushed its neighbours around. The button stays put and can be pressed
 * again.
 *
 * Same family as `PlaceholderPage`: temporary by construction, and obvious about
 * it. When a real use case exists, replace the whole component at the call site
 * rather than teaching this one to do work.
 */
export function PendingActionButton({
  children,
  pendingMessage,
  className,
}: PendingActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('h-9', className)}
      onClick={() => toast(pendingMessage)}
    >
      {children}
    </Button>
  );
}
