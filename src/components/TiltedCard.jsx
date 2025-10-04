import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * TiltedCard - hover tilt with optional image and overlay content.
 * Props:
 *  - imageSrc?: string
 *  - altText?: string
 *  - captionText?: string
 *  - containerHeight?: string | number (default: '100%')
 *  - containerWidth?: string | number (default: '100%')
 *  - rotateAmplitude?: number (default: 12)
 *  - scaleOnHover?: number (default: 1.05)
 *  - showMobileWarning?: boolean (default: false)
 *  - showTooltip?: boolean (default: false)
 *  - displayOverlayContent?: boolean (default: true)
 *  - overlayContent?: ReactNode
 *  - className?: string
 *  - style?: React.CSSProperties
 *  - onClick?: (e) => void
 */
const TiltedCard = ({
  imageSrc,
  altText = '',
  captionText,
  containerHeight = '100%',
  containerWidth = '100%',
  imageHeight,
  imageWidth,
  rotateAmplitude = 12,
  scaleOnHover = 1.05,
  showMobileWarning = false,
  showTooltip = false,
  displayOverlayContent = true,
  overlayContent,
  className = '',
  cardClassName = '',
  style,
  onClick,
  children,
}) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const percentX = (x - centerX) / centerX; // -1 to 1
    const percentY = (y - centerY) / centerY; // -1 to 1
    const ry = percentX * rotateAmplitude; // rotateY
    const rx = -percentY * rotateAmplitude; // rotateX (invert for natural feel)
    setRotation({ rx, ry });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotation({ rx: 0, ry: 0 });
  };

  return (
    <div
      style={{
        height: containerHeight,
        width: containerWidth,
        perspective: 1000,
        ...style,
      }}
      className={className}
      onClick={onClick}
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        animate={{
          rotateX: rotation.rx,
          rotateY: rotation.ry,
          scale: hovered ? scaleOnHover : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
        className={`w-full h-full rounded-2xl overflow-hidden relative ${cardClassName}`}
      >
        {/* Background image or fallback slot */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={altText}
            style={{ height: imageHeight || '100%', width: imageWidth || '100%', objectFit: 'cover' }}
            className="block"
          />
        ) : (
          <div className="absolute inset-0" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Content overlay */}
        {displayOverlayContent && (
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            {overlayContent}
            {captionText && (
              <p className="mt-1 text-white/80 text-sm font-medium">{captionText}</p>
            )}
          </div>
        )}

        {/* Children as additional overlay */}
        {children}

        {/* Tooltip (top-left) */}
        {showTooltip && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            Hover to tilt
          </div>
        )}

        {/* Optional mobile warning */}
        {showMobileWarning && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-white text-xs px-2 py-1 rounded-md">
            Best experienced on desktop
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TiltedCard;
