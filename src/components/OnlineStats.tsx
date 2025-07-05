import React from 'react';

interface OnlineStatsProps {
  isConnected: boolean;
  onlineUsersCount: number;
  typingUsersCount: number;
  totalFriends: number;
}

const OnlineStats: React.FC<OnlineStatsProps> = ({
  isConnected,
  onlineUsersCount,
  typingUsersCount,
  totalFriends,
}) => {
  const onlinePercentage = totalFriends > 0 ? Math.round((onlineUsersCount / totalFriends) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Thống kê real-time</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Connection Status */}
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <p className="text-xs text-gray-600">
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </p>
        </div>

        {/* Online Users */}
        <div className="text-center">
          <div className="text-lg font-bold text-green-600 mb-1">
            {onlineUsersCount}
          </div>
          <p className="text-xs text-gray-600">Online</p>
        </div>

        {/* Typing Users */}
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600 mb-1">
            {typingUsersCount}
          </div>
          <p className="text-xs text-gray-600">Đang nhập</p>
        </div>

        {/* Online Percentage */}
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 mb-1">
            {onlinePercentage}%
          </div>
          <p className="text-xs text-gray-600">Tỷ lệ online</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Online: {onlineUsersCount}/{totalFriends}</span>
          <span>{onlinePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${onlinePercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Real-time Indicators */}
      <div className="mt-3 flex justify-center gap-2">
        {typingUsersCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{typingUsersCount} đang nhập</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineStats; 