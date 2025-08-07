import React, { useRef } from 'react';
import { ToolbarButton } from '@/components/toolbar-button';
import { ColorPickers } from './color-picker';
import { FormatSelect } from './format-select';
import { FontSizeSelect } from './fontsize-select';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Undo,
  Redo,
} from '@/components/icons/editor-icons';

const Separator: React.FC = () => <div className='w-px bg-gray-300 mx-1 h-6' />;

interface EditorToolbarProps {
  activeFormats: Set<string>;
  onCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeFormats,
  onCommand,
  onInsertLink,
  // onInsertImage,
  onImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='flex flex-wrap gap-1 p-1 px-4 bg-gray-100 items-center justify-end'>
      {/* Undo/Redo */}
      <ToolbarButton onClick={() => onCommand('undo')} title='Undo (Ctrl+Z)'>
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('redo')}
        title='Redo (Ctrl+Shift+Z)'
      >
        <Redo size={16} />
      </ToolbarButton>

      <Separator />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => onCommand('bold')}
        active={activeFormats.has('bold')}
        title='Bold (Ctrl+B)'
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('italic')}
        active={activeFormats.has('italic')}
        title='Italic (Ctrl+I)'
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('underline')}
        active={activeFormats.has('underline')}
        title='Underline (Ctrl+U)'
      >
        <Underline size={16} />
      </ToolbarButton>

      <Separator />

      {/* Format and Font Size */}
      <FormatSelect
        onFormatChange={(format) => onCommand('formatBlock', `<${format}>`)}
      />
      <FontSizeSelect onSizeChange={(size) => onCommand('fontSize', size)} />

      <Separator />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => onCommand('justifyLeft')}
        active={activeFormats.has('alignLeft')}
        title='Align Left'
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('justifyCenter')}
        active={activeFormats.has('alignCenter')}
        title='Align Center'
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('justifyRight')}
        active={activeFormats.has('alignRight')}
        title='Align Right'
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <Separator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => onCommand('insertUnorderedList')}
        active={activeFormats.has('bulletList')}
        title='Bullet List'
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand('insertOrderedList')}
        active={activeFormats.has('numberedList')}
        title='Numbered List'
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <Separator />

      {/* Colors */}
      <ColorPickers
        onTextColorChange={(color) => onCommand('foreColor', color)}
        onBackgroundColorChange={(color) => onCommand('hiliteColor', color)}
      />

      <Separator />

      {/* Insert */}
      <ToolbarButton onClick={onInsertLink} title='Insert Link'>
        <Link size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={handleInsertImage} title='Insert Image'>
        <Image size={16} />
      </ToolbarButton>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={onImageUpload}
      />
    </div>
  );
};
