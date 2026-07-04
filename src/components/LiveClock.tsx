import React, { useState, useEffect } from 'react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null);
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Karachi');
        const data = await res.json();
        const serverTime = new Date(data.datetime);
        const localTime = new Date();
        setOffset(serverTime.getTime() - localTime.getTime());
        setTime(serverTime);
      } catch {
        const now = new Date();
        const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
        setOffset(pkt.getTime() - now.getTime());
        setTime(pkt);
      }
    };
    fetchTime();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => { setTime(new Date(Date.now() + offset)); }, 1000);
    return () => clearInterval(iv);
  }, [offset]);

  if (!time) return null;

  const day = time.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const clock = time.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="bg-black border-4 border-cyan-400 p-3 mb-6 flex flex-wrap justify-between items-center">
      <span className="text-cyan-400 font-bold text-xl">🕐 {clock}</span>
      <span className="text-gray-400 text-sm">{day}</span>
      <span className="text-gray-600 text-xs">PKT (Asia/Karachi)</span>
    </div>
  );
};
