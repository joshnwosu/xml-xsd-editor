import React from 'react';

interface ColorPickersProps {
  onTextColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
}

export const ColorPickers: React.FC<ColorPickersProps> = ({
  onTextColorChange,
  onBackgroundColorChange,
}) => (
  <div className='flex gap-1'>
    <input
      type='color'
      className='w-8 h-8 border rounded cursor-pointer'
      onChange={(e) => onTextColorChange(e.target.value)}
      title='Text Color'
    />
    <input
      type='color'
      className='w-8 h-8 border rounded cursor-pointer'
      onChange={(e) => onBackgroundColorChange(e.target.value)}
      title='Background Color'
    />
  </div>
);
