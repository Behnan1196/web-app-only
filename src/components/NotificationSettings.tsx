'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const {
    isInitialized,
    permission,
    tokens,
    logs,
    requestPermission,
    refreshTokens,
    refreshLogs,
  } = useNotifications();

  console.log('NotificationSettings - isInitialized:', isInitialized, 'permission:', permission);

  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
      await refreshTokens();
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatusColor = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getPermissionStatusText = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      default:
        return 'Not Set';
    }
  };

  if (!isInitialized) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          Initializing notifications...
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Permission Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Permission</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${getPermissionStatusColor(permission)}`}>
                {getPermissionStatusText(permission)}
              </span>
            </p>
            {permission === 'default' && (
              <p className="text-xs text-gray-500 mt-1">
                Click "Request Permission" to enable notifications
              </p>
            )}
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Requesting...' : 'Request Permission'}
            </button>
          )}
        </div>
      </div>

      {/* Registered Tokens */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Registered Devices</h3>
          <button
            onClick={refreshTokens}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        
        {tokens.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices registered</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium capitalize">{token.platform}</p>
                  <p className="text-sm text-gray-600">
                    {token.token_type.toUpperCase()} • {token.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {(token as any).created_at ? new Date((token as any).created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Notifications</h3>
          <button
            onClick={refreshLogs}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No notifications sent yet</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{log.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.status === 'sent' ? 'bg-green-100 text-green-800' :
                      log.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                    {log.platform && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs capitalize">
                        {log.platform}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {new Date(log.sent_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Filtering Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Smart Notification Filtering</h3>
        <p className="text-sm text-blue-800">
          Notifications are automatically suppressed when you're actively using the chat. 
          This helps reduce interruptions and improves your experience.
        </p>
        <ul className="text-sm text-blue-700 mt-3 space-y-1">
          <li>• No notifications when you're in the chat tab</li>
          <li>• Notifications resume when you're in other tabs or the app is closed</li>
          <li>• All notifications are logged for your review</li>
        </ul>
      </div>
    </div>
  );
};
