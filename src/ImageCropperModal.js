// src/ImageCropperModal.js
// Composant pour recadrer une image avant de la télécharger.
// Utilise 'react-easy-crop' pour la fonctionnalité de recadrage.

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getOrientation } from 'get-orientation/browser'; // Pour gérer l'orientation des images
// Importe les fonctions utilitaires. readFile est exporté une seule fois à la fin.

// Styles pour le composant Cropper
const cropperStyles = {
  containerStyle: {
    position: 'relative',
    width: '100%',
    height: 300, // Hauteur fixe pour le cropper
    background: '#333',
    borderRadius: '1rem', // rounded-xl
    overflow: 'hidden',
  },
  cropAreaStyle: {
    border: '2px solid #3B82F6', // Couleur primaire de Tailwind
    borderRadius: '0.5rem', // rounded-lg
  },
};

const ImageCropperModal = ({ imageSrc, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  // Callback lorsque la zone de recadrage change
  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  // Callback lorsque le zoom change
  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  // Callback lorsque la rotation change
  const onRotationChange = useCallback((rotation) => {
    setRotation(rotation);
  }, []);

  // Callback lorsque le recadrage est terminé (pixels finaux)
  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Gère la soumission du recadrage
  const handleSaveCrop = useCallback(async () => {
    setLoading(true);
    try {
      if (imageSrc && croppedAreaPixels) {
        // Obtenir l'image recadrée sous forme de Blob
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        onCropComplete(croppedBlob); // Appelle la fonction de rappel avec le Blob
        onClose(); // Ferme la modale
      }
    } catch (e) {
      console.error("Erreur lors du recadrage de l'image:", e);
      // Remplacer alert par toast pour une meilleure UX
      // alert("Erreur lors du recadrage de l'image.");
      // Assurez-vous d'avoir toast importé et configuré si vous déplacez cette fonction
      // toast.error("Erreur lors du recadrage de l'image.");
    } finally {
      setLoading(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropComplete, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg text-center animate-fade-in-scale border border-primary/20 mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Recadrer l'Avatar</h2>

        <div style={cropperStyles.containerStyle} className="mb-6">
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={1} // Avatar carré
            onCropChange={onCropChange}
            onRotationChange={onRotationChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round" // Forme ronde pour l'avatar
            showGrid={true}
            restrictPosition={false} // Permet de déplacer l'image en dehors de la zone de recadrage
            classes={{
                containerClassName: 'w-full h-full',
                mediaClassName: 'object-contain',
                cropAreaClassName: 'border-2 border-primary rounded-full',
            }}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="zoom-range" className="block text-text text-left font-medium mb-2 text-sm">Zoom:</label>
          <input
            id="zoom-range"
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="rotation-range" className="block text-text text-left font-medium mb-2 text-sm">Rotation:</label>
          <input
            id="rotation-range"
            type="range"
            value={rotation}
            min={0}
            max={360}
            step={1}
            aria-labelledby="Rotation"
            onChange={(e) => onRotationChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:flex-row sm:justify-end">
          <button
            onClick={handleSaveCrop}
            disabled={loading}
            className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Recadrage...' : 'Enregistrer l\'Avatar'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto bg-error hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;

// --- Fonctions utilitaires pour le recadrage (déplacées en dehors du composant et exportées ici) ---

/**
 * Reads a file as a Data URL.
 * @param {File} file The file to read.
 * @returns {Promise<string>} A promise that resolves with the Data URL.
 */
export function readFile(file) { // Exportation unique ici
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 * @param {string} imageSrc - URL of the image
 * @param {Object} pixelCrop - pixelCrop object from react-easy-crop
 * @param {number} rotation - rotation value
 */
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set canvas size to match the clipping area
  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rotation * (Math.PI / 180));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg'); // Utilise JPEG pour une taille de fichier plus petite
  });
}
