import React from 'react';

const ChatFloatingButton = ({ onClick, unreadMessagesCount }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 z-50"
      aria-label="Ouvrir le chat"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      {unreadMessagesCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
          {unreadMessagesCount}
        </span>
      )}
    </button>
  );
};

export default ChatFloatingButton;
