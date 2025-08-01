// src/ListAndInfoModal.js
import React from 'react';

const ListAndInfoModal = ({ title, children, onClose, sizeClass = 'max-w-md' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className={`bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full ${sizeClass} text-center animate-fade-in-scale border border-primary/20 mx-auto relative`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">{title}</h2>
        <div className="text-left mb-6">
          {children}
        </div>
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                     transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default ListAndInfoModal;
