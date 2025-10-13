import React, { useState, useEffect, useRef } from 'react';
import type { DataItem } from '../../../extension/src/types';
import BarContent from './BarContent';
import MousePointer from './MousePointer';
import styles from './Slideshow.module.css';

export interface Slide {
  image: string;
  data: DataItem[];
  alt: string;
  targetSpanIndex?: number;
  description?: string;
  isLastSlide?: boolean;
  url: string;
}

interface SlideshowProps {
  slides: Slide[];
  headerText?: string;
  forceWhiteText?: boolean;
  autostart?: boolean;
}

const Slideshow: React.FC<SlideshowProps> = ({ slides, headerText, forceWhiteText = false, autostart = true }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseVisible, setIsMouseVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSlowApproach, setIsSlowApproach] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredButtonIndex, setHoveredButtonIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autostart);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevSlideRef = useRef<number>(currentSlide);

  // Function to find clickable element by index and get its coordinates
  const getSpanCoordinates = (spanIndex: number) => {
    if (!containerRef.current || !barRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Find all clickable elements within the bar content
    // This includes: <a> tags, dropdown main buttons (either <a> or <span>), and dropdown arrow buttons
    const clickableElements: Element[] = [];
    
    // Get all <a> tags (regular links)
    const links = barRef.current.querySelectorAll('a');
    clickableElements.push(...Array.from(links));
    
    // Get dropdown main buttons (either <a> or <span> within dropdown containers)
    const dropdownContainers = barRef.current.querySelectorAll('div[style*="position: relative"]');
    dropdownContainers.forEach(container => {
      // Look for the main button/link within each dropdown
      const mainButton = container.querySelector('a, span[style*="cursor: pointer"]');
      if (mainButton) {
        clickableElements.push(mainButton);
      }
    });
    
    // Get dropdown arrow buttons
    const dropdownButtons = barRef.current.querySelectorAll('button[style*="cursor: pointer"]');
    dropdownButtons.forEach(button => {
      // Only include dropdown arrow buttons (those with arrow icons)
      const arrowElement = button.querySelector('div[style*="border-left"]');
      if (arrowElement) {
        clickableElements.push(button);
      }
    });
    
    const targetElement = clickableElements[spanIndex - 1]; // Convert to 0-based index
    
    if (!targetElement) {
      return null;
    }

    const elementRect = targetElement.getBoundingClientRect();
    
    // Calculate the exact center of the clickable element relative to the container
    const centerX = elementRect.left - containerRect.left + (elementRect.width / 2);
    const centerY = elementRect.top - containerRect.top + (elementRect.height / 2);
    
    // The mouse pointer tip is at the top-left corner of the 24x24 icon
    // Since we use transform: translate(-50%, -50%), we need to offset by half the icon size
    // to position the tip at the target center
    const mouseOffsetX = 12; // Half of 24px width
    const mouseOffsetY = 12; // Half of 24px height
    
    return {
      x: centerX + mouseOffsetX, // Move right to position tip at center
      y: centerY + mouseOffsetY, // Move down to position tip at center
      element: targetElement, // Return the element as well
    };
  };

  // Helper function to check if an element is a dropdown arrow button
  const isDropdownButton = (element: Element): boolean => {
    if (element.tagName !== 'BUTTON') return false;
    const arrowElement = element.querySelector('div[style*="border-left"]');
    return !!arrowElement;
  };

  // Helper function to check if an element is part of a dropdown (main button or arrow)
  const isPartOfDropdown = (element: Element): boolean => {
    // Check if this element is inside a dropdown container
    const dropdownContainer = element.closest('div[style*="position: relative"]');
    if (!dropdownContainer) return false;
    
    // Check if this container has a dropdown arrow button
    const arrowButton = dropdownContainer.querySelector('button[style*="cursor: pointer"]');
    if (!arrowButton) return false;
    
    const arrowElement = arrowButton.querySelector('div[style*="border-left"]');
    return !!arrowElement;
  };

  // Helper function to get the arrow button of a dropdown
  const getDropdownArrowButton = (element: Element): Element | null => {
    const dropdownContainer = element.closest('div[style*="position: relative"]');
    if (!dropdownContainer) return null;
    
    const arrowButton = dropdownContainer.querySelector('button[style*="cursor: pointer"]');
    if (!arrowButton) return null;
    
    const arrowElement = arrowButton.querySelector('div[style*="border-left"]');
    return arrowElement ? arrowButton : null;
  };

  // Helper function to get coordinates of the first dropdown item
  const getFirstDropdownItemCoordinates = (dropdownButton: Element) => {
    if (!containerRef.current) return null;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Find the dropdown container (parent with position: relative)
    const dropdownContainer = dropdownButton.closest('div[style*="position: relative"]');
    if (!dropdownContainer) return null;
    
    // Find the dropdown menu (div with position: absolute)
    const dropdownMenu = dropdownContainer.querySelector('div[style*="position: absolute"]');
    if (!dropdownMenu) return null;
    
    // Find the first <a> tag in the dropdown menu
    const firstItem = dropdownMenu.querySelector('a');
    if (!firstItem) return null;
    
    const itemRect = firstItem.getBoundingClientRect();
    
    // Calculate center of the first dropdown item relative to container
    const centerX = itemRect.left - containerRect.left + (itemRect.width / 2);
    const centerY = itemRect.top - containerRect.top + (itemRect.height / 2);
    
    const mouseOffsetX = 12;
    const mouseOffsetY = 12;
    
    return {
      x: centerX + mouseOffsetX,
      y: centerY + mouseOffsetY,
    };
  };

  // Animation sequence for mouse pointer
  const animateMousePointer = () => {
    if (!containerRef.current || !barRef.current) {
      return;
    }

    // Skip mouse animation for the last slide
    if (slides[currentSlide].isLastSlide) {
      setIsAnimating(true);
      // Just wait 5 seconds then either loop or stop
      setTimeout(() => {
        setIsAnimating(false);
        if (autostart) {
          // Loop back to first slide
          setCurrentSlide((prev) => (prev + 1) % slides.length);
        } else {
          // Stop playing and show play button
          setIsPlaying(false);
        }
      }, 5000);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const barRect = barRef.current.getBoundingClientRect();
    
    // Start from center of image (accounting for bar height)
    const imageStartY = barRect.height + (containerRect.height - barRect.height) / 2;
    const startX = containerRect.width / 2;
    const startY = imageStartY;
    
    // Get target coordinates for the specified span (use slide-specific target)
    const slideTargetIndex = slides[currentSlide].targetSpanIndex;
    if (!slideTargetIndex) {
      // Fallback: move mouse to the bar center so it still becomes visible
      const fallbackX = barRect.left - containerRect.left + barRect.width / 2;
      const fallbackY = barRect.top - containerRect.top + barRect.height / 2;
      setIsAnimating(true);
      setMousePosition({ x: startX, y: startY });
      setIsMouseVisible(true);
      setTimeout(() => {
        setMousePosition({ x: fallbackX, y: fallbackY });
        setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }, 400);
      return;
    }
    
    const targetCoords = getSpanCoordinates(slideTargetIndex);
    if (!targetCoords) {
      // Fallback: move mouse to the bar center so it still becomes visible
      const fallbackX = barRect.left - containerRect.left + barRect.width / 2;
      const fallbackY = barRect.top - containerRect.top + barRect.height / 2;
      setIsAnimating(true);
      setMousePosition({ x: startX, y: startY });
      setIsMouseVisible(true);
      setTimeout(() => {
        setMousePosition({ x: fallbackX, y: fallbackY });
        setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }, 400);
      return;
    }
    
    const targetX = targetCoords.x;
    const targetY = targetCoords.y;
    const targetElement = targetCoords.element;
    
    // Check if this is part of a dropdown
    const isDropdown = isPartOfDropdown(targetElement);
    const dropdownArrowButton = isDropdown ? getDropdownArrowButton(targetElement) : null;

    // Mark animation active and set initial position
    setIsAnimating(true);
    setMousePosition({ x: startX, y: startY });
    setIsMouseVisible(true);

    // Phase 1: Move quickly to near the target
    setTimeout(() => {
      const approachX = targetX - 20; // Stop 20px before the button
      const approachY = targetY;
      setMousePosition({ x: approachX, y: approachY });
      
    // Phase 2: Slow approach to the button
    setTimeout(() => {
      setIsSlowApproach(true); // Enable slow approach animation
      setMousePosition({ x: targetX, y: targetY });
      
      // Set the hovered button index
      setHoveredButtonIndex(slideTargetIndex);
      
      // Phase 3: Simulate click with tiny movement
      setTimeout(() => {
        setIsClicking(true);
        // Small movement down and back up to simulate click
        setMousePosition({ x: targetX + 2, y: targetY + 2 });
        
        setTimeout(() => {
          setMousePosition({ x: targetX, y: targetY });
          
          // If this is a dropdown, trigger actual click on the arrow button and then click first item
          if (isDropdown && dropdownArrowButton) {
            // Actually click the dropdown arrow button to open it
            (dropdownArrowButton as HTMLElement).click();
            
            // Wait for dropdown to open, then click first item
            setTimeout(() => {
              setIsClicking(false);
              
              // Get coordinates of first dropdown item
              const firstItemCoords = getFirstDropdownItemCoordinates(dropdownArrowButton);
              
              if (firstItemCoords) {
                // Move mouse to first dropdown item
                const itemX = firstItemCoords.x;
                const itemY = firstItemCoords.y;
                
                // Quick movement to near the item
                const approachItemX = itemX - 15;
                setMousePosition({ x: approachItemX, y: itemY });
                
                setTimeout(() => {
                  // Slow approach to the item
                  setMousePosition({ x: itemX, y: itemY });
                  
                  setTimeout(() => {
                    // Click the dropdown item
                    setIsClicking(true);
                    setMousePosition({ x: itemX + 2, y: itemY + 2 });
                    
                    setTimeout(() => {
                      setMousePosition({ x: itemX, y: itemY });
                      
                      // Finish and move to next slide
                      setTimeout(() => {
                        setIsClicking(false);
                        setIsSlowApproach(false);
                        setHoveredButtonIndex(0);
                        setIsAnimating(false);
                        const nextSlide = (currentSlide + 1) % slides.length;
                        setCurrentSlide(nextSlide);
                      }, 200);
                    }, 100);
                  }, 400); // Slow approach to dropdown item
                }, 300); // Quick movement to near dropdown item
              } else {
                // If we can't find the first item, just finish
                setIsSlowApproach(false);
                setHoveredButtonIndex(0);
                setIsAnimating(false);
                const nextSlide = (currentSlide + 1) % slides.length;
                setCurrentSlide(nextSlide);
              }
            }, 800); // Wait 800ms for dropdown to fully open
          } else {
            // Regular click, move to next slide
            setTimeout(() => {
              setIsClicking(false);
              setIsSlowApproach(false);
              setHoveredButtonIndex(0);
              setIsAnimating(false);
              const nextSlide = (currentSlide + 1) % slides.length;
              setCurrentSlide(nextSlide);
            }, 200);
          }
        }, 100);
      }, 400); // Slower approach to button
    }, 800); // Quick movement to approach position
    }, 1000);
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    // Only start animation if playing
    if (isPlaying) {
      // Mark animating immediately to prevent auto-advance racing the animation start
      setIsAnimating(true);
      // Start animation after 1 second
      setTimeout(() => {
        animateMousePointer();
      }, 1000);
    }
  };

  // Handle play button click
  const handlePlayClick = () => {
    setIsPlaying(true);
    // If we're on the last slide, restart from the beginning
    if (slides[currentSlide].isLastSlide) {
      setCurrentSlide(0);
    } else if (imageLoaded && !isAnimating) {
      // Image is already loaded, start animation immediately
      setIsAnimating(true);
      setTimeout(() => {
        animateMousePointer();
      }, 1000);
    }
  };

  // Reset mouse visibility when slide changes (but not on initial mount)
  useEffect(() => {
    // Only reset if the slide actually changed (not on initial mount)
    if (prevSlideRef.current !== currentSlide) {
      setIsMouseVisible(false);
      setImageLoaded(false);
      setIsSlowApproach(false);
      setHoveredButtonIndex(0);
      setProgress(0);
      prevSlideRef.current = currentSlide;
    }
  }, [currentSlide]);

  // Progress animation - tied directly to slide timing
  useEffect(() => {
    // Clear any existing progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Calculate progress based on current slide and total slides
    const slideProgress = (currentSlide / slides.length) * 100;
    setProgress(slideProgress);

    // Only animate progress if playing
    if (!isPlaying) return;

    // Animate progress for current slide
    const slideDuration = 5000; // 5 seconds per slide
    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const slideProgressPercent = (elapsed / slideDuration) * (100 / slides.length);
      const totalProgress = slideProgress + slideProgressPercent;
      
      setProgress(Math.min(totalProgress, 100));
    }, 16);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentSlide, slides.length, isPlaying]);

  // Auto-advance slides (disabled when any animation is scheduled or running, or when not playing)
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (!isAnimating && !isMouseVisible) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [isAnimating, isMouseVisible, slides.length, isPlaying]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className={styles.slideshowWrapper}>
      {/* Static header text */}
      {headerText && (
        <div className={styles.headerText}>
          {headerText}
        </div>
      )}
      
      {/* Slide description text */}
      {currentSlideData.description && (
        <div className={`${styles.descriptionText} ${forceWhiteText ? styles.forceWhite : ''}`}>
          {currentSlideData.description}
        </div>
      )}
      
      {/* Browser frame */}
      <div className={styles.browserFrame}>
        {/* Browser header */}
        <div className={styles.browserHeader}>
          <div className={styles.browserControls}>
            <div className={styles.browserButton}></div>
            <div className={styles.browserButton}></div>
            <div className={styles.browserButton}></div>
          </div>
          <div className={styles.navigationButtons}>
            <button className={styles.navButton} disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <button className={styles.navButton} disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className={styles.navButton} disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            </button>
          </div>
          <div className={styles.addressBar}>
            <div className={styles.addressBarIcon}>🔒</div>
            <div className={styles.addressBarUrl}>{currentSlideData.url}</div>
          </div>
        </div>
        
        {/* Browser content */}
        <div className={styles.browserContent} ref={containerRef}>
          {/* BarContent at the top */}
          <div className={styles.barContent} ref={barRef}>
            <BarContent data={currentSlideData.data} inDocs={true} hoveredButtonIndex={hoveredButtonIndex} />
          </div>
          
          {/* Image slideshow */}
          <div className={styles.imageContainer}>
            <img 
              src={currentSlideData.image}
              alt={currentSlideData.alt}
              className={styles.slideImage}
              onLoad={handleImageLoad}
            />
            
            {/* Slide indicators */}
            <div className={styles.indicators}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Mouse pointer animation - positioned outside image container */}
          <MousePointer
            x={mousePosition.x}
            y={mousePosition.y}
            isClicking={isClicking}
            visible={isMouseVisible}
            slowApproach={isSlowApproach}
          />
          
          {/* Transparent overlay to block clicks */}
          <div className={styles.clickBlocker} />
        </div>
        
        {/* Play button overlay (shown when not playing) */}
        {!isPlaying && (
          <div className={styles.playOverlay} onClick={handlePlayClick}>
            <button className={styles.playButton} aria-label="Play slideshow">
              <svg viewBox="0 0 24 24" className={styles.playIcon}>
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Slideshow;

