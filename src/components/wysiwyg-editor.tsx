import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const WysiwygEditor: React.FC = () => {
  const [content, setContent] = useState(
    '<p>Start editing your document...</p>'
  );

  return (
    <div className='h-full flex flex-col'>
      <div className='flex gap-2 p-2 border-b bg-gray-50'>
        <Button variant='outline' size='sm'>
          <strong>B</strong>
        </Button>
        <Button variant='outline' size='sm'>
          <em>I</em>
        </Button>
        <Button variant='outline' size='sm'>
          <u>U</u>
        </Button>
        <div className='w-px bg-gray-300 mx-2' />
        <Button variant='outline' size='sm'>
          H1
        </Button>
        <Button variant='outline' size='sm'>
          H2
        </Button>
        <Button variant='outline' size='sm'>
          H3
        </Button>
      </div>
      <div
        className='flex-1 p-4 bg-white overflow-auto'
        contentEditable
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
