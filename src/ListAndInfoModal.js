// src/ListAndInfoModal.js
import React from 'react';

const ListAndInfoModal = ({ title, children, onClose, sizeClass = 'max-w-md' }) => {
  return (
    // z-index: 50 pour la modale principale
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className={`bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full ${sizeClass} text-center animate-fade-in-scale border border-primary/20 mx-auto flex flex-col`}>
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">{title}</h3>
        {/* Ajout de max-h-[70vh] et overflow-y-auto pour le contenu */}
        <div className="flex-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default ListAndInfoModal;
