import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileX } from 'lucide-react';
import { CodeViewer } from '../code-viewer';

interface XsdTabProps {
  xsdContent: string;
  onFileUpload: () => void;
}

export const XsdTab: React.FC<XsdTabProps> = ({ xsdContent, onFileUpload }) => {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {!xsdContent ? (
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center p-8'>
            <FileX className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
            <p className='text-lg font-medium text-gray-900 mb-2'>
              No XSD File Loaded
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Import an XSD file using the menu bar or upload one directly
            </p>
            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={onFileUpload}
            >
              <Upload className='w-4 h-4 mr-2' />
              Upload XSD File
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex-1 overflow-hidden'>
          <CodeViewer code={xsdContent} language='xsd' />
        </div>
      )}
    </div>
  );
};
