'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from '@/shared/ui/indent-kit';
import { ToggleElement } from '@/shared/ui/toggle-node';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
