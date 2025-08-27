import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '@/shared/ui/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];
