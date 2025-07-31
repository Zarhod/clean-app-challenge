import React from 'react';

const ConfirmActionModal = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading,
  confirmButtonClass = 'bg-primary hover:bg-secondary',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-error mb-6">{title}</h3>
        <p className="text-base sm:text-lg mb-8 text-text">{message}</p>
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto ${confirmButtonClass} text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-sm`}
          >
            {loading ? 'Chargement...' : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
