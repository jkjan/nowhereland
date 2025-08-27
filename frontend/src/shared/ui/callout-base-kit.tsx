import { BaseCalloutPlugin } from '@platejs/callout';

import { CalloutElementStatic } from '@/shared/ui/callout-node-static';

export const BaseCalloutKit = [
  BaseCalloutPlugin.withComponent(CalloutElementStatic),
];
