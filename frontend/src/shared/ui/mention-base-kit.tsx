import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '@/shared/ui/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];
