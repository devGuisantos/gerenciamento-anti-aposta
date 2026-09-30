/**
 * How each purpose is named and drawn.
 *
 * One place, because the icon in the dropdown, the icon on the card and the icon
 * in the history have to be the same one — and because the wording is the user's
 * only clue to what a purpose means. The icon is decoration on top of a label
 * that already says everything; it is `aria-hidden` everywhere it appears.
 */
import {
  Car,
  GraduationCap,
  HeartPulse,
  House,
  Plane,
  PiggyBank,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

import type { GoalPurpose } from './_savings-goal';

type PurposeDescriptor = {
  readonly label: string;
  readonly icon: typeof PiggyBank;
};

export const GOAL_PURPOSE_DESCRIPTORS: Readonly<Record<GoalPurpose, PurposeDescriptor>> = {
  EMERGENCY_FUND: { label: 'Reserva de emergência', icon: ShieldCheck },
  DEBT_PAYOFF: { label: 'Quitar uma dívida', icon: Receipt },
  HOME: { label: 'Casa ou moradia', icon: House },
  EDUCATION: { label: 'Estudos', icon: GraduationCap },
  TRAVEL: { label: 'Viagem', icon: Plane },
  VEHICLE: { label: 'Veículo', icon: Car },
  HEALTH: { label: 'Saúde', icon: HeartPulse },
  OTHER: { label: 'Outro objetivo', icon: PiggyBank },
};
