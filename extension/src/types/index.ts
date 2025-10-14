/**
 * Shared types for the ToolJump extension
 */

import { Context } from '../adapters/types';

export type DataItem = {
  type: 'text' | 'link' | 'dropdown';
  content: string;
  href?: string;
  status?: 'important' | 'relevant' | 'success' | 'none';
  icon?: string;
  tooltip?: string;
  items?: Array<{
    content: string;
    href: string;
    status?: 'important' | 'relevant' | 'success' | 'none';
    icon?: string;
    tooltip?: string;
    alertText?: string;
  }>;
};

export interface ContextAwareProps {
  contexts: Context[];
  demoMode: boolean;
}
