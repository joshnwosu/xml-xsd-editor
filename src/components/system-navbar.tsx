import React from 'react';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  Menubar,
} from '@/components/ui/menubar';
import { useFileStore } from '@/store/file-store';

export const SystemNavBar: React.FC = () => {
  const importFile = useFileStore((state) => state.importFile);

  const handleImportXml = () => {
    importFile('xml');
  };

  const handleImportXsd = () => {
    importFile('xsd');
  };

  return (
    <div className='bg-white'>
      <Menubar className='border-none bg-transparent'>
        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New Project</MenubarItem>
            <MenubarItem>Open Project</MenubarItem>
            <MenubarItem>Save Project</MenubarItem>
            <MenubarItem>Export</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
            <MenubarItem>Redo</MenubarItem>
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Toggle Sidebar</MenubarItem>
            <MenubarItem>Toggle Editor</MenubarItem>
            <MenubarItem>Zoom In</MenubarItem>
            <MenubarItem>Zoom Out</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Validate XML</MenubarItem>
            <MenubarItem>Format Code</MenubarItem>
            <MenubarItem>Settings</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>Import</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleImportXml}>XML</MenubarItem>
            <MenubarItem onClick={handleImportXsd}>XSD</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className='cursor-pointer'>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Documentation</MenubarItem>
            <MenubarItem>Keyboard Shortcuts</MenubarItem>
            <MenubarItem>About</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};
