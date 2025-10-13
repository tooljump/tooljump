import React, { useState, useRef, useEffect } from 'react';
import { getIcon } from '../icons/icons';

interface DropdownItem {
  content: string;
  href: string;
  status?: 'important' | 'relevant' | 'success' | 'none';
  icon?: string;
  tooltip?: string;
}

interface DropdownProps {
  mainContent: string;
  mainHref?: string;
  items: DropdownItem[];
  status?: 'important' | 'relevant' | 'success' | 'none';
  icon?: string;
  tooltip?: string;
  variant?: 'inline' | 'floating';
  inDocs?: boolean;
  alertText?: string; // Custom alert text for inDocs mode
}

// Helper functions for styling - more subtle and modern
const getStatusColor = (status?: string, isLink: boolean = false) => {
  switch (status) {
    case 'important':
      return '#c92727'; // Updated red
    case 'relevant':
      return '#f59e0b'; // Softer orange
    case 'success':
      return '#10b981'; // Softer green
    default:
      return isLink ? '#6b7280' : '#6b7280'; // Subtle gray for links, gray for text
  }
};

const getHoverBackground = (status?: string) => {
  switch (status) {
    case 'important':
      return 'rgba(201, 39, 39, 0.08)';
    case 'relevant':
      return 'rgba(245, 158, 11, 0.08)';
    case 'success':
      return 'rgba(16, 185, 129, 0.08)';
    default:
      return 'rgba(99, 102, 241, 0.08)';
  }
};

const Dropdown: React.FC<DropdownProps> = ({ 
  mainContent, 
  mainHref, 
  items, 
  status, 
  icon, 
  tooltip,
  variant = 'inline',
  inDocs = false,
  alertText = 'This should navigate'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMainClick = (e: React.MouseEvent) => {
    if (mainHref) {
      if (inDocs) {
        e.preventDefault();
        alert(alertText);
        return;
      }
      // Allow the link to work normally
      return;
    }
    // If no href, clicking main button should open dropdown
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Base styles for the main button
  const mainButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: mainHref ? getStatusColor(status, true) : getStatusColor(status, false),
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    padding: '2px 6px',
    borderRadius: '6px',
    background: 'transparent',
    position: 'relative',
    cursor: 'pointer',
    border: '1px solid transparent',
    fontSize: '13px',
  };

  const arrowButtonStyle: React.CSSProperties = {
    marginLeft: '4px',
    padding: '4px',
    background: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    minWidth: '18px',
    height: '18px',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    minWidth: '200px',
    zIndex: 1000,
    padding: '6px 0',
    marginTop: '4px',
  };

  const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    color: '#374151',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '6px',
    margin: '0 4px',
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {/* Main button/link */}
        {mainHref ? (
          <a
            href={inDocs ? '#' : mainHref}
            target={inDocs ? undefined : "_blank"}
            rel={inDocs ? undefined : "noopener noreferrer"}
            title={tooltip}
            style={mainButtonStyle}
            onClick={handleMainClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = getHoverBackground(status);
              e.currentTarget.style.borderColor = getStatusColor(status, true);
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              if (variant === 'inline') {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
              if (variant === 'inline') {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {icon && (
              <img
                src={String(getIcon(icon) || '')}
                alt={icon}
                style={{ 
                  height: 14, 
                  width: 14,
                  opacity: 0.8,
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ borderBottom: '1px dotted #d6d9de' }}>{mainContent}</span>
          </a>
        ) : (
          <span
            title={tooltip}
            style={mainButtonStyle}
            onClick={handleMainClick}
          >
            {icon && (
              <img
                src={String(getIcon(icon) || '')}
                alt={icon}
                style={{ 
                  height: 14, 
                  width: 14,
                  opacity: 0.8,
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ borderBottom: '1px dotted #d6d9de' }}>{mainContent}</span>
          </span>
        )}
        
        {/* Dropdown arrow button */}
        <button
          onClick={toggleDropdown}
          style={arrowButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: isOpen ? 'none' : '3px solid #6b7280',
              borderBottom: isOpen ? '3px solid #6b7280' : 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div style={dropdownStyle}>
          {items.map((item, index) => (
            <a
              key={index}
              href={inDocs ? '#' : item.href}
              target={inDocs ? undefined : "_blank"}
              rel={inDocs ? undefined : "noopener noreferrer"}
              title={item.tooltip}
              style={{
                ...dropdownItemStyle,
                color: getStatusColor(item.status, true),
              }}
              onClick={(e) => {
                if (inDocs) {
                  e.preventDefault();
                  alert(alertText);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.icon && (
                <img
                  src={String(getIcon(item.icon) || '')}
                  alt={item.icon}
                  style={{ 
                    height: 14, 
                    width: 14,
                    opacity: 0.8,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
              )}
              <span>{item.content}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown; 