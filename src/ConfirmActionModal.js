// src/ConfirmActionModal.js
import React from 'react';

const ConfirmActionModal = ({
  title = "Confirmation",
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onClose,
  loading = false,
  confirmButtonClass = "bg-primary hover:bg-blue-600",
}) => {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 sm:px-6 pointer-events-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto">

        {/* Header */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-red-50 to-red-100">
          <h3 className="text-center text-xl font-extrabold text-red-700">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-5 text-sm text-gray-700 text-center">
          {typeof message === 'string' ? (
            <>
              {message}
            </>
          ) : (
            <div className="space-y-2">{message}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-full text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 rounded-full text-sm font-semibold text-white transition shadow-md ${confirmButtonClass}`}
          >
            {loading ? "Chargement..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
