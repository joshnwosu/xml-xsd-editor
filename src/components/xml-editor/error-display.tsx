import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className='bg-red-50 border-l-4 border-red-400 p-3'>
      <div className='flex items-center'>
        <AlertTriangle className='w-5 h-5 text-red-400 mr-2' />
        <span className='text-red-700 text-sm'>{error}</span>
      </div>
    </div>
  );
};
