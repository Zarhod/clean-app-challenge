import React from 'react';

function ConfirmActionModal({ 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  loading,
  confirmButtonClass = "bg-error hover:bg-red-700", 
  cancelButtonClass = "bg-gray-500 hover:bg-gray-600"
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto"> 
        <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-4">{title}</h3> 
        <p className="text-base sm:text-lg text-text mb-4">{message}</p> 
        <div className="flex flex-col gap-3 mt-4"> 
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmButtonClass} text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm`} 
          >
            {loading ? 'Envoi...' : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className={`${cancelButtonClass} text-white font-semibold py-2 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed tracking-wide text-sm`} 
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionModal;
