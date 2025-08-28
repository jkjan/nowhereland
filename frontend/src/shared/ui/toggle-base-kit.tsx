import { BaseTogglePlugin } from '@platejs/toggle';

import { ToggleElementStatic } from '@/shared/ui/toggle-node-static';

export const BaseToggleKit = [
  BaseTogglePlugin.withComponent(ToggleElementStatic),
];
