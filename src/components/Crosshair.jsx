import React, { useEffect, useState } from 'react';

/**
 * Full-page crosshair overlay that tracks mouse position within a given container.
 * - Shows when the mouse enters the container and hides when it leaves.
 * - Draws horizontal and vertical lines across the entire viewport at the cursor.
 *
 * Props:
 * - containerRef: ref to the hover source (defaults to window if not provided)
 * - color: CSS color for the lines (default: '#ffffff')
 * - thickness: line thickness in pixels (default: 1)
 * - opacity: line opacity (default: 0.7)
 */
const Crosshair = ({ containerRef, color = '#ffffff', thickness = 1, opacity = 0.7 }) => {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef?.current || window;
    if (!container) return;

    const handleMove = (e) => {
      // Use viewport coordinates so lines align across the entire page
      setPos({ x: e.clientX, y: e.clientY });
    };
    const handleEnter = () => setVisible(true);
    const handleLeave = () => setVisible(false);

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);

    // For window fallback, treat movement as visibility signal
    if (container === window) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('blur', handleLeave);
    }

    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
      if (container === window) {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('blur', handleLeave);
      }
    };
  }, [containerRef]);

  if (!visible) return null;

  const lineStyleCommon = {
    position: 'fixed',
    backgroundColor: color,
    opacity,
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return (
    <>
      {/* Vertical line */}
      <div
        style={{
          ...lineStyleCommon,
          top: 0,
          bottom: 0,
          left: 0,
          width: thickness,
          transform: `translateX(${Math.max(0, pos.x)}px)`,
        }}
      />
      {/* Horizontal line */}
      <div
        style={{
          ...lineStyleCommon,
          left: 0,
          right: 0,
          top: 0,
          height: thickness,
          transform: `translateY(${Math.max(0, pos.y)}px)`,
        }}
      />
    </>
  );
};

export default Crosshair;
