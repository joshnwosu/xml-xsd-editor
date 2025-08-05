import React from 'react';

export const EmptyCodeDisplay: React.FC = () => {
  return (
    <div className='flex items-center justify-center h-full bg-gray-50 text-gray-500'>
      <div className='text-center'>
        <div className='text-4xl mb-2'>📄</div>
        <p>No code to display</p>
      </div>
    </div>
  );
};
