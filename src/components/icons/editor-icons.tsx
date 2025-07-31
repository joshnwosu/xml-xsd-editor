import React from 'react';

interface IconProps {
  size?: number;
}

export const Bold: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
    <path d='M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
  </svg>
);

export const Italic: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='19' y1='4' x2='10' y2='4' />
    <line x1='14' y1='20' x2='5' y2='20' />
    <line x1='15' y1='4' x2='9' y2='20' />
  </svg>
);

export const Underline: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3' />
    <line x1='4' y1='21' x2='20' y2='21' />
  </svg>
);

export const AlignLeft: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='11' y1='14' x2='3' y2='14' />
    <line x1='17' y1='18' x2='3' y2='18' />
  </svg>
);

export const AlignCenter: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='17' y1='14' x2='7' y2='14' />
    <line x1='19' y1='18' x2='5' y2='18' />
  </svg>
);

export const AlignRight: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='21' y1='14' x2='13' y2='14' />
    <line x1='21' y1='18' x2='7' y2='18' />
  </svg>
);

export const List: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='8' y1='6' x2='21' y2='6' />
    <line x1='8' y1='12' x2='21' y2='12' />
    <line x1='8' y1='18' x2='21' y2='18' />
    <line x1='3' y1='6' x2='3.01' y2='6' />
    <line x1='3' y1='12' x2='3.01' y2='12' />
    <line x1='3' y1='18' x2='3.01' y2='18' />
  </svg>
);

export const ListOrdered: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='10' y1='6' x2='21' y2='6' />
    <line x1='10' y1='12' x2='21' y2='12' />
    <line x1='10' y1='18' x2='21' y2='18' />
    <path d='M4 6h1v4' />
    <path d='M4 10h2' />
    <path d='M6 18H4c0-1 2-2 2-3s-1-1.5-2-1' />
  </svg>
);

export const Link: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
    <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
  </svg>
);

export const Image: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <circle cx='9' cy='9' r='2' />
    <path d='M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21' />
  </svg>
);

export const Undo: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M3 7v6h6' />
    <path d='M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13' />
  </svg>
);

export const Redo: React.FC<IconProps> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M21 7v6h-6' />
    <path d='M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7' />
  </svg>
);
