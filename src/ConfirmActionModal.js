import React from 'react';

function ConfirmActionModal({ 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  loading,
  confirmButtonClass = "bg-error hover:bg-red-700", // Default to red for destructive actions
  cancelButtonClass = "bg-gray-500 hover:bg-gray-600"
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center animate-fade-in-scale border border-primary/20">
        <h3 className="text-2xl sm:text-3xl font-bold text-secondary mb-6">{title}</h3>
        <p className="text-base sm:text-lg text-text mb-6">{message}</p>
        <div className="flex flex-col gap-3 sm:gap-4 mt-4">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmButtonClass} text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base`}
          >
            {loading ? 'Envoi...' : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className={`${cancelButtonClass} text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-6 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm sm:text-base`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionModal;
