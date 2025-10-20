import React from 'react';
import Slideshow from './Slideshow';
import type { Slide } from './Slideshow';

interface SlideshowWrapperProps {
  slides?: Slide[];
  headerText?: string;
  forceWhiteText?: boolean;
  autostart?: boolean;
}

/**
 * Wrapper component for Slideshow that safely handles frontmatter access
 * during static site generation. This ensures slides data is properly embedded
 * even when frontMatter is not immediately available.
 */
const SlideshowWrapper: React.FC<SlideshowWrapperProps> = ({ 
  slides, 
  headerText, 
  forceWhiteText = false, 
  autostart = true 
}) => {
  // Safety check for slides prop
  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <p>No slides data available</p>
        <small>This integration doesn't have slides configured.</small>
      </div>
    );
  }

  return (
    <Slideshow 
      slides={slides}
      headerText={headerText}
      forceWhiteText={forceWhiteText}
      autostart={autostart}
    />
  );
};

export default SlideshowWrapper;
