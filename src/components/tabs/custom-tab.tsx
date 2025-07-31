import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface CustomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className='flex flex-col h-full'>
      {/* Tab Headers */}
      <div className='flex bg-gray-100 border-b-4 border-b-white'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
              'hover:bg-gray-200 cursor-pointer',
              activeTab === tab.id
                ? '!bg-white text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className='flex-1 bg-white overflow-auto'>{children}</div>
    </div>
  );
};
