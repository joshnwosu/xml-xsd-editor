import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FontSizeSelectProps {
  onSizeChange: (size: string) => void;
}

export const FontSizeSelect: React.FC<FontSizeSelectProps> = ({
  onSizeChange,
}) => (
  <Select onValueChange={onSizeChange}>
    <SelectTrigger className='w-20 h-8 text-sm !bg-white'>
      <SelectValue placeholder='Size' />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value='1'>8pt</SelectItem>
      <SelectItem value='2'>10pt</SelectItem>
      <SelectItem value='3'>12pt</SelectItem>
      <SelectItem value='4'>14pt</SelectItem>
      <SelectItem value='5'>18pt</SelectItem>
      <SelectItem value='6'>24pt</SelectItem>
      <SelectItem value='7'>36pt</SelectItem>
    </SelectContent>
  </Select>
);
