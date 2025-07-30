import React from 'react';
import { MessageSquare } from 'lucide-react';

export const CommentsTab: React.FC = () => {
  return (
    <div className='text-center py-8'>
      <MessageSquare className='mx-auto h-12 w-12 text-gray-400 mb-4' />
      <p className='text-gray-600'>Comments feature coming soon...</p>
    </div>
  );
};
