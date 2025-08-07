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
      className='w-10 h-6 border-0 rounded cursor-pointer'
      onChange={(e) => onTextColorChange(e.target.value)}
      title='Text Color'
      defaultValue='#000000'
    />
    <input
      type='color'
      className='w-10 h-6 border-0 rounded cursor-pointer'
      onChange={(e) => onBackgroundColorChange(e.target.value)}
      title='Background Color'
      defaultValue='#ffffff'
    />
  </div>
);
