import React from 'react';

interface TypingUser {
  userId: number;
  username: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, className = "" }) => {
  if (typingUsers.length === 0) return null;

  const getTypingMessage = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} đang nhập...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} và ${typingUsers[1].username} đang nhập...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username} và ${typingUsers[2].username} đang nhập...`;
    } else {
      return `${typingUsers.length} người đang nhập...`;
    }
  };

  return (
    <div className={`flex justify-start mb-4 animate-fade-in ${className}`}>
      <div className="flex items-end gap-3 max-w-xs">
        {/* Typing users avatars */}
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 4).map((user, index) => (
            <div key={user.userId} className="relative group">
              <img
                src={user.avatar || `https://i.pravatar.cc/150?u=${user.userId}`}
                alt={user.username}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-pulse-typing"></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {user.username}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          ))}
          {typingUsers.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-medium">
              +{typingUsers.length - 4}
            </div>
          )}
        </div>
        
        {/* Typing bubble */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-700 mb-2 font-medium">
            {getTypingMessage()}
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 