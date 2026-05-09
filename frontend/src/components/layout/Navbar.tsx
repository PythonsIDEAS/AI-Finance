"use client";

import { useState, useEffect } from "react";
import { Bell, User, Menu, Check } from "lucide-react";
import { api } from "@/lib/api";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6 glass-card bg-card relative z-30">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-4 md:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-medium hidden sm:block">Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-background">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 md:w-80 rounded-md border border-border bg-card shadow-lg glass p-2 z-50">
              <h3 className="font-semibold text-sm p-2 border-b border-border mb-2">Notifications</h3>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex items-start justify-between p-2 hover:bg-accent rounded-md transition-colors group">
                      <div className="text-sm pr-2">
                        <span className="font-medium text-red-400 block mb-1">Budget Alert</span>
                        <span className="text-muted-foreground text-xs leading-tight">{n.message}</span>
                      </div>
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-muted-foreground hover:text-primary p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 border-l border-border pl-4">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
