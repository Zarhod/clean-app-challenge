import React from 'react';

const ConfirmActionModal = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonClass = "bg-red-600 hover:bg-red-700", // Default danger style
  loading = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md animate-fade-in-scale border border-primary/20 mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-text mb-4">
          {title}
        </h3>
        <p className="text-lightText text-md mb-6">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${confirmButtonClass} text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin-fast mr-2"></div>
                Confirmation...
              </div>
            ) : (
              confirmText
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
