import React from 'react';

const ListAndInfoModal = ({
  title,
  children,
  onClose,
  sizeClass = 'max-w-md',
  hideHeaderClose = false // <--- ajout ici
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${sizeClass} text-center animate-fade-in-scale border border-gray-200 overflow-hidden`}
      >
        {/* Header cohérent */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/20">
          <h2 className="text-center text-xl sm:text-2xl font-extrabold text-primary">
            {title}
          </h2>
          {!hideHeaderClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition text-lg"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6 sm:p-8 text-left">
          {children}
        </div>

        {/* Footer avec bouton fermer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                      transition duration-300 ease-in-out transform hover:scale-105 tracking-wide text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListAndInfoModal;
