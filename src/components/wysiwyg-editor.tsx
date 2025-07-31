import React, { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Bold = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
    <path d='M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
  </svg>
);

const Italic = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='19' y1='4' x2='10' y2='4' />
    <line x1='14' y1='20' x2='5' y2='20' />
    <line x1='15' y1='4' x2='9' y2='20' />
  </svg>
);

const Underline = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3' />
    <line x1='4' y1='21' x2='20' y2='21' />
  </svg>
);

const AlignLeft = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='11' y1='14' x2='3' y2='14' />
    <line x1='17' y1='18' x2='3' y2='18' />
  </svg>
);

const AlignCenter = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='17' y1='14' x2='7' y2='14' />
    <line x1='19' y1='18' x2='5' y2='18' />
  </svg>
);

const AlignRight = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='21' y1='10' x2='3' y2='10' />
    <line x1='21' y1='6' x2='3' y2='6' />
    <line x1='21' y1='14' x2='13' y2='14' />
    <line x1='21' y1='18' x2='7' y2='18' />
  </svg>
);

const List = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='8' y1='6' x2='21' y2='6' />
    <line x1='8' y1='12' x2='21' y2='12' />
    <line x1='8' y1='18' x2='21' y2='18' />
    <line x1='3' y1='6' x2='3.01' y2='6' />
    <line x1='3' y1='12' x2='3.01' y2='12' />
    <line x1='3' y1='18' x2='3.01' y2='18' />
  </svg>
);

const ListOrdered = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='10' y1='6' x2='21' y2='6' />
    <line x1='10' y1='12' x2='21' y2='12' />
    <line x1='10' y1='18' x2='21' y2='18' />
    <path d='M4 6h1v4' />
    <path d='M4 10h2' />
    <path d='M6 18H4c0-1 2-2 2-3s-1-1.5-2-1' />
  </svg>
);

const Link = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
    <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
  </svg>
);

const Image = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <circle cx='9' cy='9' r='2' />
    <path d='M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21' />
  </svg>
);

const Undo = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M3 7v6h6' />
    <path d='M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13' />
  </svg>
);

const Redo = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M21 7v6h-6' />
    <path d='M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7' />
  </svg>
);

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}

export default function WysiwygEditor() {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Check which formats are currently active
  const updateActiveFormats = (): void => {
    const formats = new Set<string>();

    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
    if (document.queryCommandState('justifyRight')) formats.add('alignRight');
    if (document.queryCommandState('insertUnorderedList'))
      formats.add('bulletList');
    if (document.queryCommandState('insertOrderedList'))
      formats.add('numberedList');

    setActiveFormats(formats);
  };

  // Execute document commands
  const execCommand = (command: string, value?: string): void => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
    updateCounts();
  };

  // Update word and character counts
  const updateCounts = (): void => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      setCharCount(textContent.length);
      const words = textContent.split(/\s+/).filter((word) => word.length > 0);
      setWordCount(words.length);
    }
  };

  // Handle content changes
  const handleInput = (): void => {
    updateActiveFormats();
    updateCounts();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
      }
    }
  };

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = (): void => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = '<p>Start editing your document...</p>';
      updateCounts();
    }
  }, []);

  // Insert link
  const insertLink = (): void => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Insert image
  const insertImage = (): void => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>): void => {
        if (event.target?.result && typeof event.target.result === 'string') {
          execCommand('insertImage', event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Format block (headings, paragraphs)
  const formatBlock = (tag: string): void => {
    execCommand('formatBlock', `<${tag}>`);
  };

  // Change font size
  const changeFontSize = (size: string): void => {
    execCommand('fontSize', size);
  };

  // Change text color
  const changeTextColor = (color: string): void => {
    execCommand('foreColor', color);
  };

  // Change background color
  const changeBackgroundColor = (color: string): void => {
    execCommand('hiliteColor', color);
  };

  const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    onClick,
    active = false,
    children,
    title,
  }) => (
    <button
      className={`h-8 w-8 p-0 border rounded text-sm hover:bg-gray-100 flex items-center justify-center ${
        active
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-white border-gray-300'
      }`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );

  const Separator: React.FC = () => (
    <div className='w-px bg-gray-300 mx-1 h-6' />
  );

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-white'>
      {/* Toolbar */}
      <div className='flex flex-wrap gap-1 p-1 bg-gray-100 items-center'>
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => execCommand('undo')}
          title='Undo (Ctrl+Z)'
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('redo')}
          title='Redo (Ctrl+Shift+Z)'
        >
          <Redo size={16} />
        </ToolbarButton>

        <Separator />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => execCommand('bold')}
          active={activeFormats.has('bold')}
          title='Bold (Ctrl+B)'
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('italic')}
          active={activeFormats.has('italic')}
          title='Italic (Ctrl+I)'
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('underline')}
          active={activeFormats.has('underline')}
          title='Underline (Ctrl+U)'
        >
          <Underline size={16} />
        </ToolbarButton>

        <Separator />

        {/* Headings */}
        <Select onValueChange={(value) => formatBlock(value)}>
          <SelectTrigger className='w-32 h-8 text-sm !bg-white'>
            <SelectValue placeholder='Format' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='p'>Paragraph</SelectItem>
            <SelectItem value='h1'>Heading 1</SelectItem>
            <SelectItem value='h2'>Heading 2</SelectItem>
            <SelectItem value='h3'>Heading 3</SelectItem>
            <SelectItem value='h4'>Heading 4</SelectItem>
            <SelectItem value='h5'>Heading 5</SelectItem>
            <SelectItem value='h6'>Heading 6</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select onValueChange={(value) => changeFontSize(value)}>
          <SelectTrigger className='w-20 h-8 text-sm !bg-white'>
            <SelectValue placeholder='Size' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1'>8pt</SelectItem>
            <SelectItem value='2'>10pt</SelectItem>
            <SelectItem value='3'>12pt</SelectItem>
            <SelectItem value='4'>14pt</SelectItem>
            <SelectItem value='5'>18pt</SelectItem>
            <SelectItem value='6'>24pt</SelectItem>
            <SelectItem value='7'>36pt</SelectItem>
          </SelectContent>
        </Select>

        <Separator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => execCommand('justifyLeft')}
          active={activeFormats.has('alignLeft')}
          title='Align Left'
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('justifyCenter')}
          active={activeFormats.has('alignCenter')}
          title='Align Center'
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('justifyRight')}
          active={activeFormats.has('alignRight')}
          title='Align Right'
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          active={activeFormats.has('bulletList')}
          title='Bullet List'
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          active={activeFormats.has('numberedList')}
          title='Numbered List'
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <Separator />

        {/* Colors */}
        <div className='flex gap-1'>
          <input
            type='color'
            className='w-8 h-8 border rounded cursor-pointer'
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              changeTextColor(e.target.value)
            }
            title='Text Color'
          />
          <input
            type='color'
            className='w-8 h-8 border rounded cursor-pointer'
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              changeBackgroundColor(e.target.value)
            }
            title='Background Color'
          />
        </div>

        <Separator />

        {/* Insert */}
        <ToolbarButton onClick={insertLink} title='Insert Link'>
          <Link size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={insertImage} title='Insert Image'>
          <Image size={16} />
        </ToolbarButton>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleImageUpload}
        />
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className='flex-1 p-4 outline-none overflow-auto min-h-96 bg-white'
        style={{
          lineHeight: '1.5',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
      />

      {/* Status Bar */}
      <div className='flex justify-between items-center px-4 py-2 bg-gray-100 text-sm text-gray-600'>
        <div className='flex gap-4'>
          <span>Words: {wordCount}</span>
          <span>Characters: {charCount}</span>
        </div>
        <div className='text-xs text-gray-500'>
          Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
        </div>
      </div>
    </div>
  );
}
