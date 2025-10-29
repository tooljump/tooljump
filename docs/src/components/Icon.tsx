import React from 'react';
import { getIcon } from './icons/icons';

export interface IconProps {
  /** The name of the icon to display */
  name: string;
  /** Optional size in pixels (default: 24) */
  size?: number;
  /** Optional alt text for accessibility (defaults to icon name) */
  alt?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Icon component that displays icons from the icons collection.
 * Can be used in MDX pages and other React components.
 * 
 * @example
 * <Icon name="datadog" size={32} />
 * <Icon name="github" className="my-icon" />
 */
const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  alt, 
  className, 
  style 
}) => {
  const iconSrc = getIcon(name);
  
  if (!iconSrc) {
    return null;
  }

  return (
    <img
      src={String(iconSrc)}
      alt={alt || name}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    />
  );
};

export default Icon;
