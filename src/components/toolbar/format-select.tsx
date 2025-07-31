import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormatSelectProps {
  onFormatChange: (format: string) => void;
}

export const FormatSelect: React.FC<FormatSelectProps> = ({
  onFormatChange,
}) => (
  <Select onValueChange={onFormatChange}>
    <SelectTrigger className='w-32 h-8 text-sm !bg-white'>
      <SelectValue placeholder='Format' />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value='p'>Paragraph</SelectItem>
      <SelectItem value='h1'>Heading 1</SelectItem>
      <SelectItem value='h2'>Heading 2</SelectItem>
      <SelectItem value='h3'>Heading 3</SelectItem>
      <SelectItem value='h4'>Heading 4</SelectItem>
      <SelectItem value='h5'>Heading 5</SelectItem>
      <SelectItem value='h6'>Heading 6</SelectItem>
    </SelectContent>
  </Select>
);
