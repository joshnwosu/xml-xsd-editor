import React from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  active = false,
  children,
  title,
}) => (
  <button
    className={`h-8 w-8 p-0 border rounded text-sm hover:bg-gray-100 flex items-center justify-center ${
      active
        ? 'bg-blue-500 text-white border-blue-500'
        : 'bg-white border-gray-300'
    }`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);
