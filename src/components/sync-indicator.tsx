import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncIndicatorProps {
  hasChanges: boolean;
  error: string | null;
  lastSyncTime?: Date;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  hasChanges,
  error,
  lastSyncTime,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasChanges || error) {
      setIsVisible(true);
    } else {
      // Hide after a delay when synced
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasChanges, error]);

  if (!isVisible && !hasChanges && !error) return null;

  return (
    <div className='flex items-center gap-2 text-sm'>
      {error ? (
        <>
          <AlertCircle className='w-4 h-4 text-red-500' />
          <span className='text-red-600'>Sync error</span>
        </>
      ) : hasChanges ? (
        <>
          <RefreshCw className='w-4 h-4 text-blue-500 animate-spin' />
          <span className='text-blue-600'>Syncing...</span>
        </>
      ) : (
        <>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className='text-green-600'>Synced</span>
          {lastSyncTime && (
            <span className='text-gray-500 text-xs'>
              ({new Date(lastSyncTime).toLocaleTimeString()})
            </span>
          )}
        </>
      )}
    </div>
  );
};
