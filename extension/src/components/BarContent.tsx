import React from 'react';
import { getIcon } from '../icons/icons';
import Dropdown from './Dropdown';
import { DataItem } from '../types';
import { getStatusColor, getHoverStyles } from '../utils/statusHelpers';


interface BarContentProps {
  data: DataItem[];
  inDocs?: boolean;
  hoveredButtonIndex?: number;
  alertText?: string;
}


const BarContent: React.FC<BarContentProps> = ({ data, inDocs = false, hoveredButtonIndex = 0, alertText = 'This should navigate to the URL specified in the href field of the link' }) => {
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
        <img width={18} style={{marginRight: '4px'}} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEnWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA5LTIxPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjdiOGY2NjAwLTU3ZmItNGYzNS05ZDMzLWY2NWVlNjMxNThmYTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5pY29uIC0gMjwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0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' />
        ToolJump
      </span>
      <span style={{
        color: '#d1d5db',
        margin: '0 4px',
        fontSize: '12px',
      }}>
        •
      </span>
      {data.map((item, index) => {
        const clickableIndex = index + 1; // Clickable elements start at index 1
        const isHovered = hoveredButtonIndex === clickableIndex;
        
        return (
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: getStatusColor(item.status),
                  transition: 'all 0.2s ease',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid transparent',
                  verticalAlign: 'middle',
                  ...getHoverStyles(item.status, isHovered),
                }}
                title={item.tooltip}
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
              href={inDocs ? '#' : item.href}
              target={inDocs ? undefined : "_blank"}
              rel={inDocs ? undefined : "noopener noreferrer"}
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
                fontSize: '13px',
                border: '1px solid transparent',
                verticalAlign: 'middle',
                ...getHoverStyles(item.status, isHovered),
              }}
              onClick={(e) => {
                if (inDocs) {
                  e.preventDefault();
                  alert(alertText);
                }
              }}
              onMouseEnter={(e) => {
                // Only apply real hover effects if not in animation mode
                if (!isHovered) {
                  const hoverStyles = getHoverStyles(item.status, true);
                  Object.assign(e.currentTarget.style, hoverStyles);
                }
              }}
              onMouseLeave={(e) => {
                // Only remove real hover effects if not in animation mode
                if (!isHovered) {
                  const normalStyles = getHoverStyles(item.status, false);
                  Object.assign(e.currentTarget.style, normalStyles);
                }
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
            <Dropdown
              mainContent={item.content}
              mainHref={item.href}
              items={item.items}
              status={item.status}
              icon={item.icon}
              tooltip={item.tooltip}
              variant="inline"
              inDocs={inDocs}
              alertText={alertText}
            />
          )}
        </React.Fragment>
        );
      })}
    </>
  );
};

export default BarContent; 