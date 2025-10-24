import React, { useState, useRef, useEffect } from 'react';
import { Context } from '../adapters/types';
import { logger } from '../utils/logger';

interface ContextOverlayProps {
  context: Context;
}

const ContextOverlay: React.FC<ContextOverlayProps> = ({ context }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Overlay dimensions and margins
  const OVERLAY_WIDTH = 300;
  const OVERLAY_MIN_HEIGHT = 300;
  const OVERLAY_MAX_HEIGHT = 700;
  const MARGIN = 20;

  logger.debug('ContextOverlay', 'Component rendered with context', context);
  logger.debug('ContextOverlay', 'Context type', context.type);

  const [position, setPosition] = useState(() => {
    // Calculate bottom right position
    const x = window.innerWidth - OVERLAY_WIDTH - MARGIN;
    const y = window.innerHeight - OVERLAY_MIN_HEIGHT - MARGIN;
    return { x, y };
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const formatContext = (ctx: Context): string => {
    return JSON.stringify(ctx, null, 2);
  };

  const handleClose = () => {
    // Set the debug setting to false
    chrome.storage.local.set({ debugShowContext: false }, () => {
      if (chrome.runtime.lastError) {
        logger.error('ContextOverlay', 'Error saving debug setting', chrome.runtime.lastError);
      } else {
        // Show alert message
        alert('Context overlay closed. You can enable it again from the extension\'s settings if needed.');
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking the close button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = overlayRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep overlay within viewport bounds
      const maxX = window.innerWidth - OVERLAY_WIDTH - MARGIN;
      const maxY = window.innerHeight - OVERLAY_MIN_HEIGHT - MARGIN;
      
      setPosition({
        x: Math.max(MARGIN, Math.min(newX, maxX)),
        y: Math.max(MARGIN, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Only show overlay if there's a valid context type (adapter matched)
  if (!context.type) {
    logger.debug('ContextOverlay', 'No context type, returning null');
    return null;
  }

  logger.debug('ContextOverlay', 'Rendering overlay with context type', context.type);
  logger.debug('ContextOverlay', 'Position', position);

  return (
    <div 
      ref={overlayRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${OVERLAY_WIDTH}px`,
        minHeight: `${OVERLAY_MIN_HEIGHT}px`,
        maxHeight: `${OVERLAY_MAX_HEIGHT}px`,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        lineHeight: 1.3,
        color: 'rgba(0, 0, 0, 0.9)',
        zIndex: 999999,
        overflow: 'auto',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="drag-handle"
        style={{
          fontWeight: 'bold',
          fontSize: '12px',
          marginBottom: '8px',
          color: '#333',
          borderBottom: '1px solid #eee',
          paddingBottom: '4px',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>⋮⋮</span>
          <span>Current Context (Updated: {new Date().toLocaleTimeString()})</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#666',
            padding: '2px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#666';
          }}
        >
          ✕
        </button>
      </div>
      <pre style={{ 
        margin: 0, 
        fontSize: '10px', 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all',
        pointerEvents: 'auto',
        userSelect: 'text',
      }}>
        {formatContext(context)}
      </pre>
    </div>
  );
};

export default ContextOverlay; 