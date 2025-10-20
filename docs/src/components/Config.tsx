import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Render a value from docusaurus.config.ts `customFields` by key.
 *
 * Usage in MDX:
 * ```mdx
 * import {ConfigValue} from '@site/src/components/Config';
 *
 * Example URL: <ConfigValue name="exampleUrl" />
 * ```
 */
export type ConfigValueProps = {
  /** Key inside siteConfig.customFields */
  name: string;
  /** Content to render when the key is missing or undefined */
  fallback?: React.ReactNode;
  /** Optional prefix to render before the value */
  prefix?: React.ReactNode;
  /** Optional suffix to render after the value */
  suffix?: React.ReactNode;
  /**
   * Optional render function to control how the value is displayed.
   * Receives the raw value from customFields.
   */
  render?: (value: unknown) => React.ReactNode;
};

export function ConfigValue({ name, fallback, prefix, suffix, render }: ConfigValueProps) {
  const { siteConfig } = useDocusaurusContext();
  const customFields = (siteConfig as any)?.customFields ?? {};
  const rawValue = customFields[name as keyof typeof customFields];

  if (rawValue === undefined || rawValue === null) {
    return <>{fallback ?? ''}</>;
  }

  const content = render ? render(rawValue) : String(rawValue);
  return <>{prefix}{content}{suffix}</>;
}

export default ConfigValue;


