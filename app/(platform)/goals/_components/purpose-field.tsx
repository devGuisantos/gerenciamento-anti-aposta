'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { GOAL_PURPOSE_DESCRIPTORS } from '../_goal-purposes';
import { GOAL_PURPOSES, type GoalPurpose } from '../_savings-goal';

type PurposeFieldProps = {
  readonly purpose: GoalPurpose;
  readonly onPurposeChange: (purpose: GoalPurpose) => void;
};

/** What a goal is for, in one place because `/goals` and `/bets` both create one. */
export function PurposeField({ purpose, onPurposeChange }: PurposeFieldProps) {
  const fieldId = useId();
  const SelectedIcon = GOAL_PURPOSE_DESCRIPTORS[purpose].icon;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>Para que serve</Label>
      {/* A hidden input rather than Radix's own `name`, so what the action reads is
          the value this component is holding and nothing else. */}
      <input type="hidden" name="purpose" value={purpose} />
      <Select value={purpose} onValueChange={onPurposeChange}>
        <SelectTrigger id={fieldId} className="h-10 w-full">
          {/* `SelectValue` needs explicit children: its items only register once the
              portal opens, so an empty one renders blank on the server. */}
          <SelectValue>
            <span className="flex items-center gap-2">
              <SelectedIcon aria-hidden className="size-4 text-muted-foreground" />
              {GOAL_PURPOSE_DESCRIPTORS[purpose].label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {GOAL_PURPOSES.map((option) => {
            const { label, icon: Icon } = GOAL_PURPOSE_DESCRIPTORS[option];

            return (
              <SelectItem key={option} value={option}>
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
