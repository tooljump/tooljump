// Re-export the BarContent component with corrected import paths
import React from 'react';
import { getIcon } from '../icons/icons';
import { DataItem } from '../types';


interface BarContentProps {
  data: DataItem[];
}

// Helper function to get status color - more subtle and modern
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

// Helper function to get hover background color - more subtle
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

const BarContent: React.FC<BarContentProps> = ({ data }) => {
  return (
    <>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: '#111827',
        fontWeight: 600,
        fontSize: '15px',
        textShadow: 'none',
        marginRight: '4px',
        padding: '2px 6px',
        borderRadius: '6px',
        border: '1px solid transparent',
        verticalAlign: 'middle',
      }}>
        ToolJump
      </span>
      <span style={{
        color: '#d1d5db',
        margin: '0 4px',
        fontSize: '12px',
      }}>
        •
      </span>
      {data.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span style={{
              color: '#d1d5db',
              margin: '0 4px',
              fontSize: '12px',
            }}>
              •
            </span>
          )}
          {item.type === 'text' && (
            <span 
              title={item.tooltip}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: getStatusColor(item.status),
                transition: 'color 0.2s ease',
                fontSize: '13px',
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid transparent',
                verticalAlign: 'middle',
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
            </span>
          )}
          {item.type === 'link' && item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.tooltip}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: getStatusColor(item.status, true),
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'transparent',
                fontSize: '13px',
                border: '1px solid transparent',
                verticalAlign: 'middle',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = getHoverBackground(item.status);
                e.currentTarget.style.borderColor = getStatusColor(item.status, true);
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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
              <span style={{ borderBottom: '1px dotted #d6d9de' }}>{item.content}</span>
            </a>
          )}
          {item.type === 'dropdown' && item.items && (
            <div style={{ display: 'inline-block' }}>
              {/* Simplified dropdown for docs - just show the main content */}
              <span 
                title={item.tooltip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: getStatusColor(item.status, true),
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'transparent',
                  fontSize: '13px',
                  border: '1px solid transparent',
                  verticalAlign: 'middle',
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
                <span style={{ borderBottom: '1px dotted #d6d9de' }}>{item.content}</span>
                <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default BarContent;