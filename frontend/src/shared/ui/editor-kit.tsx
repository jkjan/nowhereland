'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AIKit } from '@/shared/ui/ai-kit';
import { AlignKit } from '@/shared/ui/align-kit';
import { AutoformatKit } from '@/shared/ui/autoformat-kit';
import { BasicBlocksKit } from '@/shared/ui/basic-blocks-kit';
import { BasicMarksKit } from '@/shared/ui/basic-marks-kit';
import { BlockMenuKit } from '@/shared/ui/block-menu-kit';
import { BlockPlaceholderKit } from '@/shared/ui/block-placeholder-kit';
import { CalloutKit } from '@/shared/ui/callout-kit';
import { CodeBlockKit } from '@/shared/ui/code-block-kit';
import { ColumnKit } from '@/shared/ui/column-kit';
import { CommentKit } from '@/shared/ui/comment-kit';
import { CopilotKit } from '@/shared/ui/copilot-kit';
import { CursorOverlayKit } from '@/shared/ui/cursor-overlay-kit';
import { DateKit } from '@/shared/ui/date-kit';
import { DiscussionKit } from '@/shared/ui/discussion-kit';
import { DndKit } from '@/shared/ui/dnd-kit';
import { DocxKit } from '@/shared/ui/docx-kit';
import { EmojiKit } from '@/shared/ui/emoji-kit';
import { ExitBreakKit } from '@/shared/ui/exit-break-kit';
import { FixedToolbarKit } from '@/shared/ui/fixed-toolbar-kit';
import { FloatingToolbarKit } from '@/shared/ui/floating-toolbar-kit';
import { FontKit } from '@/shared/ui/font-kit';
import { LineHeightKit } from '@/shared/ui/line-height-kit';
import { LinkKit } from '@/shared/ui/link-kit';
import { ListKit } from '@/shared/ui/list-kit';
import { MarkdownKit } from '@/shared/ui/markdown-kit';
import { MathKit } from '@/shared/ui/math-kit';
import { MediaKit } from '@/shared/ui/media-kit';
import { MentionKit } from '@/shared/ui/mention-kit';
import { SlashKit } from '@/shared/ui/slash-kit';
import { SuggestionKit } from '@/shared/ui/suggestion-kit';
import { TableKit } from '@/shared/ui/table-kit';
import { TocKit } from '@/shared/ui/toc-kit';
import { ToggleKit } from '@/shared/ui/toggle-kit';

export const EditorKit = [
  ...CopilotKit,
  ...AIKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
