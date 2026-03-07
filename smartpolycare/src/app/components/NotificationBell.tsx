"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, Info, AlertTriangle } from "lucide-react";
import { useNotifications } from "./Contexts/NotificationContext";

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-900">No notifications yet</p>
                <p className="mt-1 text-xs text-gray-500">We'll alert you when it's time for your meals.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${
                        notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                        notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                         notification.type === 'success' ? <Check className="h-4 w-4" /> :
                         <Info className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1 pr-6">
                        <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"} text-gray-900`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button
                          onClick={() => clearNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="h-2 w-2 rounded-full bg-teal-500"
                            aria-label="Mark as read"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 5 && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-center">
              <p className="text-[10px] text-gray-500 font-medium italic">Showing last 50 notifications</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
