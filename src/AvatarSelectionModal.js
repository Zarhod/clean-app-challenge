import React, { useState, useEffect, useRef, useCallback } from 'react'; // <-- Ajout de useCallback ici
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const AvatarSelectionModal = ({ currentAvatar, currentPhotoURL, onClose, onSave }) => {
  const { currentUser } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [avatarType, setAvatarType] = useState(currentPhotoURL ? 'photo' : 'emoji');
  const [loading, setLoading] = useState(false);

  // Pour le recadrage d'image
  const [imageSrc, setImageSrc] = useState(currentPhotoURL);
  const [crop, setCrop] = useState({ aspect: 1, unit: '%', width: 90 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Liste d'emojis pour les avatars
  const avatarOptions = [
    '😀', '😁', '😂', '😇', '😈', '😉', '😊', '😍', '😎', '🤓', '🤔', '🤫', '😶', '😐', '🙄', '😴', '🥳', '🤩',
    '🤖', '👾', '👽', '👻', '🎃', '😺', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉', '🦋', '🐢', '🐍', '🐉', '🐳', '🐬', '🐠', '🐙', '🦀', '🦞', '🦐', '🦑', '🐡', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️', '🦅', '🦆', '🦢', '🦩', '🦜', '🐦', '🐧', '🦉', '🦚', '🦃', '🐓', '🐔', '🐣', '🐤', '🐥', '👶', '👦', '👧', '🧑', '👨', '👩', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧟', '🧞', '👨‍🦯', '👩‍🦯', '👨‍🦼', '👩‍🦼', '👨‍🦽', '👩‍🦽', '🗣️', '👤', '👥', '🫂'];

  useEffect(() => {
    if (avatarType === 'emoji') {
      setImageSrc(null);
      setCompletedCrop(null);
    } else {
      setSelectedAvatar(null);
      // Si on passe en mode photo et qu'il y a une photo actuelle, la charger
      if (currentPhotoURL && !imageSrc) {
        setImageSrc(currentPhotoURL);
      }
    }
  }, [avatarType, currentPhotoURL, imageSrc]);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop controlled
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
  }, []);

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = 'cropped.jpeg';
        resolve(blob);
      }, 'image/jpeg', 0.75);
    });
  }, [completedCrop]);

  const uploadPhoto = async (userId, croppedBlob) => {
    if (!croppedBlob) return null;
    const storage = getStorage();
    // Utiliser un nom de fichier unique pour éviter les conflits et faciliter la suppression si nécessaire
    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_cropped.jpeg`);
    await uploadBytes(storageRef, croppedBlob);
    return await getDownloadURL(storageRef);
  };

  const deleteOldPhoto = async (photoURL) => {
    if (!photoURL || !currentUser) return;
    const storage = getStorage();
    try {
      // Pour supprimer, il faut une référence exacte au fichier.
      // Si photoURL est un URL de téléchargement, il faut extraire le chemin.
      // Firebase Storage URLs sont généralement de la forme:
      // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path_to_file>?alt=media...
      const path = photoURL.split('/o/')[1]?.split('?')[0];
      if (path) {
        const decodedPath = decodeURIComponent(path);
        const photoRef = ref(storage, decodedPath);
        await deleteObject(photoRef);
        console.log("Ancienne photo supprimée de Storage.");
      }
    } catch (error) {
      console.warn("Impossible de supprimer l'ancienne photo (peut-être déjà supprimée ou permissions insuffisantes):", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let newAvatarValue = null;
    let newPhotoURLValue = null;

    try {
      if (avatarType === 'emoji') {
        newAvatarValue = selectedAvatar;
        // Si on passe d'une photo à un emoji, supprimer l'ancienne photo
        if (currentPhotoURL) {
          await deleteOldPhoto(currentPhotoURL);
        }
      } else { // avatarType === 'photo'
        if (imageSrc && completedCrop) {
          const croppedBlob = await getCroppedImg();
          if (croppedBlob) {
            // Supprimer l'ancienne photo si elle existe et est différente de la nouvelle
            if (currentPhotoURL && currentPhotoURL !== imageSrc) { // Comparer avec imageSrc (l'URL de l'image actuellement chargée pour le crop)
              await deleteOldPhoto(currentPhotoURL);
            }
            newPhotoURLValue = await uploadPhoto(currentUser.uid, croppedBlob);
          } else {
            toast.error("Erreur lors du recadrage de l'image.");
            setLoading(false);
            return;
          }
        } else if (currentPhotoURL && !imageSrc) { // L'utilisateur a enlevé la photo existante
          await deleteOldPhoto(currentPhotoURL);
          newPhotoURLValue = null;
        } else { // Aucune nouvelle photo sélectionnée, conserver l'ancienne si elle existe
          newPhotoURLValue = currentPhotoURL;
        }
      }
      
      onSave({ newAvatar: newAvatarValue, newPhotoURL: newPhotoURLValue });
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de l'avatar.");
      console.error("Error saving avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-xs sm:max-w-md text-center animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4">
          Changer votre Avatar
        </h3>

        <div className="flex justify-center items-center mb-4 space-x-4">
          <span className="text-gray-700 font-medium">Emoji</span>
          <label htmlFor="avatarTypeToggle" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="avatarTypeToggle"
              className="sr-only peer"
              checked={avatarType === 'photo'}
              onChange={() => setAvatarType(prev => prev === 'emoji' ? 'photo' : 'emoji')}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className="text-gray-700 font-medium">Photo</span>
        </div>

        {avatarType === 'emoji' ? (
          <>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 mb-4 bg-neutralBg rounded-lg border border-gray-200">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-2 rounded-lg text-3xl sm:text-4xl flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110
                              ${selectedAvatar === avatar ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-gray-100 text-text shadow-sm'}`}
                  disabled={loading}
                >
                  {avatar}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-500 text-xs mt-2">Votre avatar actuel: <span className="text-xl align-middle">{selectedAvatar}</span></p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-gray-50">
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
              disabled={loading}
            />
            {imageSrc && (
              <div className="mt-4 w-full flex flex-col items-center">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  circularCrop
                  className="max-w-full h-auto"
                >
                  <img ref={imgRef} alt="Source" src={imageSrc} onLoad={onImageLoad} className="max-w-full h-auto" />
                </ReactCrop>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    display: 'none',
                    width: completedCrop?.width,
                    height: completedCrop?.height,
                  }}
                />
                {completedCrop && (
                  <p className="text-sm text-gray-500 mt-2">Image prête à être recadrée.</p>
                )}
              </div>
            )}
            {!imageSrc && <p className="text-sm text-gray-500 mt-2">Aucune photo sélectionnée.</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer l\'Avatar'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg
                       transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
