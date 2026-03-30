import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const BirrIcon: React.FC<IconProps> = ({ className = "", size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fill="currentColor"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        Br
      </text>
    </svg>
  );
};