import React from 'react';

/**
 * Composant modal générique pour afficher des listes ou des informations.
 * @param {string} title - Le titre du modal.
 * @param {function} onClose - Fonction de rappel pour fermer le modal.
 * @param {string} sizeClass - Classe Tailwind CSS pour contrôler la largeur maximale (ex: "max-w-md", "max-w-xl").
 * @param {React.Node} children - Le contenu à afficher à l'intérieur du modal.
 */
function ListAndInfoModal({ title, onClose, sizeClass = "max-w-lg", children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[999] p-4">
      <div className={`bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full ${sizeClass} animate-fade-in-scale border border-primary/20 mx-auto flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary flex-grow text-center pr-8 pl-8">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-lightText hover:text-text transition-colors duration-200 text-3xl leading-none font-semibold absolute top-4 right-4"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ListAndInfoModal;
