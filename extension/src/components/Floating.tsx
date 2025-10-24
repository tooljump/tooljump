import React, { useState, useEffect, useRef } from 'react';
import { CollectorManager } from '../adapters/manager';
import { getIcon } from '../icons/icons';
import Dropdown from './Dropdown';
import { logger } from '../utils/logger';
import { ContextAwareProps, DataItem } from '../types';
import { useContextData } from '../hooks/useContextData';
import { getStatusColor, getHoverBackground } from '../utils/statusHelpers';

interface Position {
  x: number;
  y: number;
}


const Floating: React.FC<ContextAwareProps> = ({ contexts, demoMode }) => {
  const { data, isVisible } = useContextData(contexts);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load position from storage
  const loadPosition = async () => {
    try {
      const currentSiteContext = CollectorManager.getCurrentSiteContext();
      const adapterKey = currentSiteContext?.getContextType() || 'default';
      
      const result = await new Promise<{ [key: string]: Position }>((resolve) => {
        chrome.storage.local.get([`floatingPosition_${adapterKey}`], (result) => {
          resolve(result);
        });
      });

      const savedPosition = result[`floatingPosition_${adapterKey}`];
      if (savedPosition) {
        // Check if position is within document bounds
        const documentWidth = document.documentElement.clientWidth || window.innerWidth;
        const documentHeight = document.documentElement.clientHeight || window.innerHeight;
        const maxX = documentWidth - 70; // Button width + padding
        const maxY = documentHeight - 70; // Button height + padding

        if (savedPosition.x >= 0 && savedPosition.x <= maxX && 
            savedPosition.y >= 0 && savedPosition.y <= maxY) {
          setPosition(savedPosition);
        } else {
          // Reset to top-right if outside document bounds
          const topRightX = documentWidth - 70; // 20px from right edge
          setPosition({ x: topRightX, y: 20 });
        }
      }
    } catch (error) {
      logger.error('Floating', 'Error loading position', error);
      // Reset to top-right on error
      const documentWidth = document.documentElement.clientWidth || window.innerWidth;
      const topRightX = documentWidth - 70; // 20px from right edge
      setPosition({ x: topRightX, y: 20 });
    }
  };

  // Save position to storage
  const savePosition = async (newPosition: Position) => {
    try {
      const currentSiteContext = CollectorManager.getCurrentSiteContext();
      const adapterKey = currentSiteContext?.getContextType() || 'default';
      
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [`floatingPosition_${adapterKey}`]: newPosition }, () => {
          resolve();
        });
      });
    } catch (error) {
      logger.error('Floating', 'Error saving position', error);
    }
  };


  useEffect(() => {
    loadPosition();
  }, []);

  // Handle window resize to keep button within bounds
  useEffect(() => {
    const handleResize = () => {
      const documentWidth = document.documentElement.clientWidth || window.innerWidth;
      const documentHeight = document.documentElement.clientHeight || window.innerHeight;
      
      // Calculate maximum allowed positions
      const maxX = documentWidth - (isExpanded ? 50 : 70); // Button width when expanded, button + padding when collapsed
      const maxY = documentHeight - (isExpanded ? 300 : 70); // Panel height or button height
      
      // Check if current position is outside bounds
      if (position.x > maxX || position.y > maxY) {
        // Constrain to new bounds
        const constrainedX = Math.max(0, Math.min(position.x, maxX));
        const constrainedY = Math.max(0, Math.min(position.y, maxY));
        
        setPosition({ x: constrainedX, y: constrainedY });
        // Save the new constrained position
        savePosition({ x: constrainedX, y: constrainedY });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [position, isExpanded]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Constrain to viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // When expanded, the panel extends to the right of the button
        // So the button can go further right (up to viewport width - button width)
        const maxX = viewportWidth - (isExpanded ? 50 : 70); // Button width when expanded, button + padding when collapsed
        const maxY = viewportHeight - (isExpanded ? 300 : 70); // Panel height or button height

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: constrainedX, y: constrainedY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Only show if we have data from the server
  if (!isVisible || data.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      className="tooljump-floating-container"
    >
      {/* Floating T button */}
      <button
        onClick={toggleExpanded}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #7c3aed, #6b7280)',
          color: 'white',
          border: 'none',
          fontSize: '18px',
          fontWeight: '600',
          cursor: 'grab',
          boxShadow: '0 4px 12px rgba(107, 114, 128, 0.25)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }
        }}
        className="tooljump-floating-button"
      >
        <span style={{
          transition: 'all 0.3s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          {isExpanded ? '×' : <img width={36} style={{position: 'relative', top: 3}} src={getIcon('tj') || ''} draggable={false}/> }
        </span>
        
        {/* Notification badge for important items */}
        {(() => {
          const importantCount = data.filter(item => item.status === 'important').length;
          if (importantCount > 0) {
            return (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                minWidth: '18px',
                height: '18px',
                backgroundColor: '#c92727',
                color: 'white',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                zIndex: 1,
              }}>
                {importantCount > 99 ? '99+' : importantCount}
              </div>
            );
          }
          return null;
        })()}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          width: '190px',
          maxWidth: '90vw',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          zIndex: 9999998,
          animation: 'tooljumpSlideIn 0.3s ease-out',
        }}
        className="tooljump-floating-panel"
      >
          {/* Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          className="tooljump-panel-content"
          >
            <FloatingBarContent data={data} demoMode={demoMode} />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes tooljumpSlideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
};

// Custom BarContent component for floating panel with better styling
const FloatingBarContent: React.FC<{ data: DataItem[]; demoMode?: boolean }> = ({ data, demoMode }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {data.map((item, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 0',
        }}>
          {item.icon && item.type !== 'dropdown' && (
            <img
              src={getIcon(item.icon) || ''}
              alt={item.icon}
              style={{ 
                height: 16, 
                width: 16,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          {item.type === 'text' && (
            <span 
              title={item.tooltip}
              style={{
                color: getStatusColor(item.status),
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
            >
              {item.content}
            </span>
          )}
          {item.type === 'link' && item.href && (
            <a
              href={demoMode ? '#' : item.href}
              target={demoMode ? undefined : "_blank"}
              rel={demoMode ? undefined : "noopener noreferrer"}
              title={item.tooltip}
              style={{
                color: getStatusColor(item.status, true),
                textDecoration: 'none',
                fontWeight: item.status === 'important' ? '600' : '500',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
              onClick={(e) => {
                if (demoMode) {
                  e.preventDefault();
                  alert('This is a demo mode, so it will not navigate to any tools. To connect the tools you use in your organisation, please set up your own server by following the instructions in the "Getting started" guide in ToolJump\'s docs.');
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = getHoverBackground(item.status);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {item.content}
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
              variant="floating"
              inDocs={demoMode}
              alertText="This is a demo mode, so it will not navigate to any tools. To connect the tools you use in your organisation, please set up your own server by following the instructions in the 'Getting started' guide in ToolJump's docs."
            />
          )}
        </div>
      ))}
    </div>
  );
};




export default Floating;
