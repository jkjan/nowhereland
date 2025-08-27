'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/shared/ui/link-node';
import { LinkFloatingToolbar } from '@/shared/ui/link-toolbar';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
