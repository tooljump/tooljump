import React from 'react';
import BarContent from './BarContent';


interface BarContentPreviewProps {
  data: any;
  title?: string;
}

const BarContentPreview: React.FC<BarContentPreviewProps> = ({ 
  data,
  title = "Preview"
}) => {
  data = [...data, {
    type: 'text',
    content: ' ... Other items ... '
  }]
  return (
    <div style={{ 
      margin: '20px 0',
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb'
    }}>
      <h4 style={{ 
        margin: '0 0 15px 0', 
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151'
      }}>
        {title}
      </h4>
      <div style={{
        display: 'flex',
        padding: '8px 12px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '13px',
        width: '100%',
        alignItems: 'center',
      }}>
        <BarContent data={data} inDocs={true} />
      </div>
    </div>
  );
};

export default BarContentPreview;
