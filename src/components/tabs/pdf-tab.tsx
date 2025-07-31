import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface PdfTabProps {
  pdfFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PdfTab: React.FC<PdfTabProps> = ({ pdfFile, onFileUpload }) => {
  return (
    <div className='space-y-4 p-8'>
      <div className='text-center py-8'>
        <FileText className='mx-auto h-12 w-12 text-gray-400 mb-4 stroke-1' />
        <p className='text-muted-foreground'>PDF feature coming soon...</p>
      </div>
      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hidden'>
        <FileText className='mx-auto h-12 w-12 text-gray-400 mb-4' />
        <p className='text-sm text-gray-600 mb-4'>
          Upload a PDF file to view and process
        </p>
        <input
          type='file'
          accept='.pdf'
          onChange={onFileUpload}
          className='hidden'
          id='pdf-upload'
        />
        <Button asChild>
          <label htmlFor='pdf-upload' className='cursor-pointer'>
            <Upload className='w-4 h-4 mr-2' />
            Upload PDF
          </label>
        </Button>
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
