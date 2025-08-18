import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';

interface PdfTabProps {
  pdfFile: File | null;
  onFileUpload: () => void;
}

export const PdfTab: React.FC<PdfTabProps> = ({ pdfFile, onFileUpload }) => {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center p-8'>
          <FileText className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
          <p className='text-lg font-medium text-gray-900 mb-2'>
            No PDF to display
          </p>
          <p className='text-sm text-gray-500 mb-6'>
            Import an XML file using the menu bar or upload one directly
          </p>

          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={onFileUpload}
          >
            <Upload className='w-4 h-4 mr-2' />
            Upload XML File
          </Button>
        </div>
      </div>
      {pdfFile && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <p className='text-sm text-green-800'>
            <strong>Uploaded:</strong> {pdfFile.name}
          </p>
          <p className='text-xs text-green-600'>
            Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
};
