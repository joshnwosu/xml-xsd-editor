import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WysiwygEditor } from './wysiwyg-editor';

export const EditorPanel: React.FC = () => {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>Document Editor</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 p-0'>
        <WysiwygEditor />
      </CardContent>
    </Card>
  );
};
