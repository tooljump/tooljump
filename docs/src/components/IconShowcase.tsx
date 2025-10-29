import React from 'react';
import { getIconNames, getIcon } from '../icons/icons';

const IconShowcase: React.FC = () => {
  const iconNames = getIconNames();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '16px',
      margin: '20px 0',
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb'
    }}>
      {iconNames.map((iconName) => (
        <div
          key={iconName}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textAlign: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <img
            src={String(getIcon(iconName) || '')}
            alt={iconName}
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              marginBottom: '8px',
              opacity: 0.9
            }}
          />
          <code style={{
            fontSize: '12px',
            color: '#374151',
            backgroundColor: '#f3f4f6',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace'
          }}>
            {iconName}
          </code>
        </div>
      ))}
    </div>
  );
};

export default IconShowcase;
