import React, { useEffect, useRef } from 'react';

interface GlobalCallNotificationProps {
  open: boolean;
  callInfo: {
    from: string;
    username: string;
    avatar: string;
    type: 'audio' | 'video';
  } | null;
  onAccept: () => void;
  onReject: () => void;
}

const GlobalCallNotification: React.FC<GlobalCallNotificationProps> = ({ open, callInfo, onAccept, onReject }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open && audioRef.current) {
      const soundEnabled = localStorage.getItem('notificationSoundEnabled');
      if (soundEnabled === null || soundEnabled === 'true') {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [open]);

  if (!open || !callInfo) return null;

  return (
    <div className="fixed z-50 top-6 right-6 max-w-xs w-full bg-white border border-violet-200 shadow-2xl rounded-2xl flex items-center p-4 animate-fade-in
      sm:right-6 sm:left-auto
      left-1/2 right-auto -translate-x-1/2 sm:translate-x-0
      sm:max-w-xs max-w-[90vw]"
      style={{ boxShadow: '0 8px 32px rgba(80, 0, 180, 0.15)' }}>
      <img src={callInfo.avatar} alt={callInfo.username} className="w-14 h-14 rounded-full border-2 border-violet-400 mr-4" />
      <div className="flex-1">
        <div className="font-semibold text-violet-700 text-base">Incoming {callInfo.type === 'video' ? 'Video' : 'Audio'} Call</div>
        <div className="text-gray-800 font-medium">{callInfo.username}</div>
        <div className="flex mt-2 space-x-2">
          <button onClick={onAccept} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-full font-medium transition">Accept</button>
          <button onClick={onReject} className="bg-gray-200 hover:bg-gray-300 text-violet-700 px-4 py-1.5 rounded-full font-medium transition">Reject</button>
        </div>
      </div>
      <audio ref={audioRef} src="/Ringtone.mp3" loop />
    </div>
  );
};

export default GlobalCallNotification; 
