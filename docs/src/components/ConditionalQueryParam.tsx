import React, { useEffect, useState, ReactNode } from 'react';

interface ConditionalQueryParamProps {
  param: string;
  value?: string;
  children: ReactNode;
}

/**
 * Conditionally renders content based on URL query parameters
 * 
 * @param param - The query parameter name to check for
 * @param value - Optional: specific value to match (if not provided, just checks if param exists)
 * @param children - Content to render when condition is met
 * 
 * @example
 * // Shows content when ?from_extension is present
 * <ConditionalQueryParam param="from_extension">
 *   <p>This only shows with ?from_extension in the URL</p>
 * </ConditionalQueryParam>
 * 
 * @example
 * // Shows content only when ?source=extension
 * <ConditionalQueryParam param="source" value="extension">
 *   <p>This only shows with ?source=extension in the URL</p>
 * </ConditionalQueryParam>
 */
export default function ConditionalQueryParam({ param, value, children }: ConditionalQueryParamProps): JSX.Element | null {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get(param);
    
    if (value !== undefined) {
      // Check if param exists AND matches specific value
      setShouldShow(paramValue === value);
    } else {
      // Just check if param exists
      setShouldShow(params.has(param));
    }
  }, [param, value]);

  if (!shouldShow) {
    return null;
  }

  return <div className="conditional-query-param">{children}</div>;
}

