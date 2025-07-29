// src/ConfirmActionModal.js
import React from 'react';
import ListAndInfoModal from './ListAndInfoModal'; // Assurez-vous que ce chemin est correct

const ConfirmActionModal = ({ title, message, confirmText, confirmButtonClass, cancelText, onConfirm, onCancel, loading }) => {
  return (
    <ListAndInfoModal title={title} onClose={onCancel} sizeClass="max-w-xs sm:max-w-md">
      <p className="text-center text-text text-lg mb-6">{message}</p>
      <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end"> {/* Centré sur mobile, aligné à droite sur desktop */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`w-full sm:w-auto font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 ${confirmButtonClass}`}
        >
          {loading ? 'Chargement...' : confirmText}
        </button>
      </div>
    </ListAndInfoModal>
  );
};

export default ConfirmActionModal;
