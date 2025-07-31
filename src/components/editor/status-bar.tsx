// import React from 'react';

// interface StatusBarProps {
//   wordCount: number;
//   charCount: number;
// }

// export const StatusBar: React.FC<StatusBarProps> = ({
//   wordCount,
//   charCount,
// }) => (
//   <div className='flex justify-between items-center px-4 py-2 bg-gray-100 text-sm text-gray-600'>
//     <div className='flex gap-4'>
//       <span>Words: {wordCount}</span>
//       <span>Characters: {charCount}</span>
//     </div>
//     <div className='text-xs text-gray-500'>
//       Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
//     </div>
//   </div>
// );

// components/editor/status-bar.tsx (Updated)
import React from 'react';

interface StatusBarProps {
  wordCount: number;
  charCount: number;
  additionalInfo?: React.ReactNode;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wordCount,
  charCount,
  additionalInfo,
}) => {
  return (
    <div className='flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-sm text-gray-600'>
      <div className='flex items-center space-x-4'>
        <span>Words: {wordCount.toLocaleString()}</span>
        <span>Characters: {charCount.toLocaleString()}</span>
        {additionalInfo && (
          <span className='flex items-center'>{additionalInfo}</span>
        )}
      </div>
      <div className='text-xs text-gray-500'>Ready</div>
    </div>
  );
};
