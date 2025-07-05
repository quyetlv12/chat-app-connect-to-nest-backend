import React, { useEffect, useState } from 'react';

interface NewMessageNotificationProps {
  newMessageCount: number;
  onClear: () => void;
}

const NewMessageNotification: React.FC<NewMessageNotificationProps> = ({ 
  newMessageCount, 
  onClear 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (newMessageCount > 0) {
      setIsVisible(true);
      playNotificationSound();
      
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newMessageCount]);

  const playNotificationSound = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      try {
        // Create a simple notification sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        setTimeout(() => setIsPlaying(false), 200);
      } catch (error) {
        console.log('Audio not supported');
        setIsPlaying(false);
      }
    }
  };

  const handleClick = () => {
    setIsVisible(false);
    onClear();
  };

  if (!isVisible || newMessageCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-all duration-300 animate-bounce"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              {newMessageCount}
            </div>
          </div>
          <span className="font-medium">
            {newMessageCount === 1 ? 'Tin nhắn mới' : `${newMessageCount} tin nhắn mới`}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NewMessageNotification; 