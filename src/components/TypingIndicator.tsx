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
    <div className={`flex justify-start animate-fade-in ${className}`}>
      <div className="flex items-end gap-3 max-w-[85%] sm:max-w-[75%]">
        {/* Enhanced Typing users avatars */}
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <div key={user.userId} className="relative group">
              <div className="relative">
                <img
                  src={user.avatar || `https://i.pravatar.cc/150?u=${user.userId}`}
                  alt={user.username}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 border-white shadow-lg ring-2 ring-amber-100 group-hover:ring-amber-200 transition-all duration-200 object-cover"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-amber-400 to-orange-400 border-3 border-white rounded-full animate-pulse-typing shadow-lg"></span>
              
              {/* Enhanced Tooltip for desktop */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-10 hidden sm:block shadow-xl">
                {user.username}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          ))}
          {typingUsers.length > 3 && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-3 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              +{typingUsers.length - 3}
            </div>
          )}
        </div>
        
        {/* Enhanced Typing bubble */}
        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-lg rounded-bl-md hover:shadow-xl transition-all duration-200">
          <div className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">
            {getTypingMessage()}
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm"></div>
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 