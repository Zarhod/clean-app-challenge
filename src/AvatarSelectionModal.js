import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à db et auth

const AvatarSelectionModal = ({ onClose }) => {
  const { currentUser, setCurrentUser, db, auth } = useUser(); // Récupère db et auth du contexte
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '👤');
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isCustomImageSelected, setIsCustomImageSelected] = useState(false);

  const predefinedAvatars = ['😀', '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🦋', '🦉', '🐺', '🦄', '🐲', '🤖', '👽', '👻', '🤡', '🤠', '😎', '🤓', '🥳', '🤯', '🥶', '🥵', '😴', '😷', '😇', '😈', '💩', '👍', '👎', '💪', '🧠', '👀', '🌟', '🚀', '💡', '🏆', '🌿', '💧', '⚡', '🔥', '🌍', '🌱', '♻️', '✨', '🌈', '☀️', '🌙', '🌊', '🌲', '🌳', '🌼', '🌷', '🍎', '🥕', '🥦', '🍕', '🍔', '🍟', '🍣', '🍦', '🍩', '☕', '🎮', '⚽', '🏀', '🏈', '⚾', '🎾', '🎳', '🎯', '🎸', '🎹', '🎤', '🎧', '🎨', '📚', '🔬', '🔭', '🧪', '🧬', '🧭', '🗺️', '⏰', '⏳', '💻', '📱', '🖥️', '🖨️', '🖱️', '⌨️', '💾', '💿', '📀', '💽', '📈', '📊', '📉', '📦', '🎁', '🎉', '🎊', '🎈', '🎀', '🎁', '🎄', '🎃', '🎆', '🎇', '🌠', '🌌', '🌉', '🏞️', '🏙️', '🏘️', '🏠', '🏡', '🏢', '🏗️', '🏭', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '🗼', '🗽', '🗿', '🎡', '🎢', '🎠', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '⛽', '🚨', '🚥', '🚧', '⚓', '⛵', '🚤', '🚢', '✈️', '🛫', '🛬', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🛎️', '🧳', '💼', '👔', '👕', '👖', '👗', '👙', '👚', '👛', '👜', '👝', '🎒', '🩱', '🩲', '🩳', '🩴', '👟', '👞', '👠', '👡', '👢', '👑', '🎩', '🎓', '🧢', '⛑️', '📿', '💍', '💎', '💄', '💅', '🗣️', '👤', '👥', '🫂', '👣', '👂', '👃', '👁️', '👅', '👄', '👍', '👎', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '🖕', '👇', '✍️', '👏', '🙌', '👐', '🤲', '🙏', '🤝', '💅', '🤳', '💃', '🕺', '🚶', '🏃', '🧍', '🧎', '🧑‍🤝‍🧑', '👭', '👫', '👬', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👪', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂', '👣', '👂', '👃', '👁️', '👅', '👄', '👍', '👎', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '🖕', '👇', '✍️', '👏', '🙌', '👐', '🤲', '🙏', '🤝', '💅', '🤳', '💃', '🕺', '🚶', '🏃', '🧍', '🧎', '🧑‍🤝‍🧑', '👭', '👫', '👬', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👪', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧'];


  // Effet pour dessiner l'image recadrée sur le canvas
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Réinitialise le crop si une nouvelle image est sélectionnée
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsCustomImageSelected(true);
        setSelectedAvatar(null); // Désélectionne l'emoji si une image est choisie
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveAvatar = async () => {
    setLoading(true);
    try {
      if (!currentUser || !db) {
        toast.error("Utilisateur non connecté ou base de données non disponible.");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);

      if (isCustomImageSelected && completedCrop && previewCanvasRef.current) {
        // Sauvegarde l'image recadrée sur Firebase Storage
        const canvas = previewCanvasRef.current;
        const storage = getStorage();
        const authInstance = getAuth(); // Obtenir l'instance d'authentification
        const user = authInstance.currentUser; // Obtenir l'utilisateur actuellement connecté

        if (!user) {
          toast.error("Aucun utilisateur connecté pour sauvegarder l'image.");
          setLoading(false);
          return;
        }

        canvas.toBlob(async (blob) => {
          if (blob) {
            const imageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.png`);
            await uploadBytes(imageRef, blob);
            const photoURL = await getDownloadURL(imageRef);

            await updateDoc(userDocRef, {
              photoURL: photoURL,
              avatar: null // S'assurer que l'avatar emoji est effacé
            });
            setCurrentUser(prev => ({ ...prev, photoURL: photoURL, avatar: null }));
            toast.success("Photo de profil mise à jour !");
            onClose();
          } else {
            toast.error("Erreur lors de la création de l'image.");
          }
          setLoading(false);
        }, 'image/png', 1);
      } else if (selectedAvatar) {
        // Sauvegarde l'avatar emoji
        await updateDoc(userDocRef, {
          avatar: selectedAvatar,
          photoURL: null // S'assurer que la photo de profil est effacée
        });
        setCurrentUser(prev => ({ ...prev, avatar: selectedAvatar, photoURL: null }));
        toast.success("Avatar mis à jour !");
        onClose();
      } else {
        toast.error("Veuillez sélectionner un avatar ou une image.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'avatar:", error);
      toast.error("Erreur lors de la sauvegarde de l'avatar.");
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    try {
      if (!currentUser || !db) {
        toast.error("Utilisateur non connecté ou base de données non disponible.");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: null,
        avatar: '👤' // Revenir à l'avatar par défaut
      });
      setCurrentUser(prev => ({ ...prev, photoURL: null, avatar: '👤' }));
      setImageSrc(null); // Réinitialiser l'aperçu de l'image
      setSelectedAvatar('👤'); // Sélectionner l'avatar par défaut
      setIsCustomImageSelected(false);
      toast.success("Photo de profil supprimée !");
    } catch (error) {
      console.error("Erreur lors de la suppression de la photo:", error);
      toast.error("Erreur lors de la suppression de la photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">
          Choisir votre Avatar
        </h3>

        {/* Section de l'avatar actuel */}
        <div className="flex flex-col items-center mb-6">
          <p className="text-lightText text-sm mb-2">Avatar actuel :</p>
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Current Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-md" />
          ) : (
            <span className="text-6xl leading-none">{currentUser?.avatar || '👤'}</span>
          )}
          {currentUser?.photoURL && (
            <button
              onClick={handleRemovePhoto}
              disabled={loading}
              className="mt-3 bg-error hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Supprimer la photo
            </button>
          )}
        </div>

        {/* Sélection d'image personnalisée */}
        <div className="mb-6 border-t border-gray-200 pt-6">
          <h4 className="text-xl font-bold text-text mb-4 text-center">Importer une image</h4>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary file:cursor-pointer mb-4"
            disabled={loading}
          />

          {imageSrc && (
            <div className="flex flex-col items-center mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // Force un ratio 1:1 pour un avatar carré/rond
                minWidth={50}
                minHeight={50}
                circularCrop
              >
                <img ref={imgRef} alt="Source" src={imageSrc} className="max-w-full h-auto rounded-lg shadow-md" />
              </ReactCrop>
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: completedCrop?.width ?? 0,
                  height: completedCrop?.height ?? 0,
                  borderRadius: '50%', // Pour un aperçu rond
                  marginTop: '1rem',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                className="mx-auto"
              />
              <p className="text-lightText text-xs mt-2">Aperçu de l'image recadrée (rond)</p>
            </div>
          )}
        </div>

        {/* Sélection d'emoji prédéfinis */}
        <div className="mb-6 border-t border-gray-200 pt-6">
          <h4 className="text-xl font-bold text-text mb-4 text-center">Ou choisir un emoji</h4>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 rounded-lg bg-neutralBg border border-gray-100">
            {predefinedAvatars.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedAvatar(emoji);
                  setIsCustomImageSelected(false);
                  setImageSrc(null); // Clear custom image selection
                }}
                className={`p-1.5 rounded-full text-3xl transition duration-200 transform hover:scale-110
                  ${selectedAvatar === emoji ? 'bg-primary shadow-lg' : 'bg-gray-200 hover:bg-gray-300'} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={loading}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <button
            onClick={handleSaveAvatar}
            disabled={loading || (!selectedAvatar && !imageSrc)}
            className="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-md"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder l\'Avatar'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-md"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
