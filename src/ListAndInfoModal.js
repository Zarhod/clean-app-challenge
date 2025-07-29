// src/ListAndInfoModal.js
import React from 'react';

const ListAndInfoModal = ({ title, children, onClose, sizeClass = 'max-w-lg' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className={`bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full ${sizeClass} text-center animate-fade-in-scale border border-primary/20 mx-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary flex-grow text-center">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition duration-300 text-3xl font-bold p-1 leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        {/* Le contenu enfant est maintenant enveloppé pour gérer le centrage des boutons */}
        <div className="flex flex-col items-center"> 
          {children}
        </div>
      </div>
    </div>
  );
};

export default ListAndInfoModal;
