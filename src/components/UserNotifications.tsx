import React from 'react';
import { useApp } from '../context/AppContext';

export const UserNotifications: React.FC = () => {
  const { notifications } = useApp();
  const activeNotifications = (notifications || []).filter(n => n.isActive);

  if (activeNotifications.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {activeNotifications.map(notif => (
        <div key={notif.id} className="bg-yellow-400 border-4 border-yellow-600 shadow-[4px_4px_0_0_rgb(202,138,4)] p-4">
          <h3 className="font-bold text-black text-lg mb-1">📢 {notif.title}</h3>
          <p className="text-black">{notif.message}</p>
          <p className="text-black text-xs mt-2 opacity-60">{new Date(notif.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};
