import React from 'react';

/**
 * Composant modal générique pour afficher des listes ou des informations.
 * @param {Object} props - Les props du composant.
 * @param {string} props.title - Le titre de la modal.
 * @param {JSX.Element} props.children - Le contenu à afficher dans la modal.
 * @param {function} props.onClose - Fonction de rappel pour fermer la modal.
 * @param {string} [props.sizeClass='max-w-full sm:max-w-md'] - Classe Tailwind pour la largeur maximale de la modal.
 */
function ListAndInfoModal({ title, children, onClose, sizeClass = 'max-w-xs sm:max-w-md' }) { 
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"> 
      <div className={`bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full ${sizeClass} text-center animate-fade-in-scale border border-primary/20 mx-auto`}> 
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center"> 
          {title}
        </h3>
        <div className="text-left max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300 text-sm" 
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default ListAndInfoModal;
