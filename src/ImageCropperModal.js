// src/ImageCropperModal.js
// Composant pour recadrer une image avant de la télécharger.
// Utilise 'react-easy-crop' pour la fonctionnalité de recadrage.

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getOrientation } from 'get-orientation/browser';
import { getCroppedImg, getRotatedImage } from './canvasUtils';

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

  // Callback lorsque le recadrage est complet
  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      // 'croppedImage' est un objet Blob. Nous pouvons le passer à la fonction onCropComplete.
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Erreur lors du recadrage de l\'image :', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full transform transition-all duration-300 ease-in-out scale-95 md:scale-100 opacity-0 animate-fade-in-up">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recadrer l'image</h2>
        <div className="relative">
          <div className="relative w-full" style={{ height: '300px' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
              classes={{
                containerClassName: 'rounded-xl',
                cropAreaClassName: 'border-2 border-primary rounded-lg',
              }}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                onZoomChange(e.target.value);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Rotation</label>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => {
                setRotation(e.target.value);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !croppedAreaPixels}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-secondary transition-colors duration-200 disabled:bg-gray-400"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;

// Fonctions utilitaires pour le traitement de l'image.
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Pour des raisons de sécurité, nous devons utiliser une requête cross-origin
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

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

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/png');
  });
}

export function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
}
