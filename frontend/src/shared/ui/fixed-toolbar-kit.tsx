'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '@/shared/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/shared/ui/fixed-toolbar-buttons';

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
];
