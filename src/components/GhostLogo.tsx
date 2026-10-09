import React from 'react';
import { GHOST_LOGO_SRC } from '../assets/logo';

interface GhostLogoProps {
  className?: string;
  alt?: string;
}

export const GhostLogo: React.FC<GhostLogoProps> = ({
  className = 'w-10 h-10',
  alt = 'Un Fantasma en el Sistema'
}) => {
  return (
    <img
      src={GHOST_LOGO_SRC}
      alt={alt}
      className={`inline-block object-contain select-none transition-transform duration-200 hover:scale-105 ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};
