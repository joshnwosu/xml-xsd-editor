import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Code, Edit3 } from 'lucide-react';

interface EditorHeaderProps {
  hasChanges: boolean;
  viewMode: 'wysiwyg' | 'xml';
  onToggleViewMode: () => void;
  onRefresh: () => void;
  onSave: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  hasChanges,
  viewMode,
  onToggleViewMode,
  onRefresh,
  onSave,
}) => {
  return (
    <div className='flex items-center justify-between py-2 px-4 bg-white border-b'>
      <div className='flex items-center space-x-3'>
        <span className='font-medium text-gray-900'>XML Document Editor</span>
        {hasChanges && (
          <span className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded'>
            Unsaved changes
          </span>
        )}
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onToggleViewMode}
          className='flex items-center space-x-2'
        >
          {viewMode === 'wysiwyg' ? (
            <>
              <Code className='w-4 h-4' />
              <span>XML View</span>
            </>
          ) : (
            <>
              <Edit3 className='w-4 h-4' />
              <span>Document View</span>
            </>
          )}
        </Button>

        {viewMode === 'wysiwyg' && (
          <>
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              className='flex items-center space-x-2'
            >
              <RefreshCw className='w-4 h-4' />
              <span>Refresh</span>
            </Button>

            <Button
              size='sm'
              onClick={onSave}
              disabled={!hasChanges}
              className='flex items-center space-x-2'
            >
              <Save className='w-4 h-4' />
              <span>Save</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
