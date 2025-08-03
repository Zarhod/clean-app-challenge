import React, { useState, Fragment } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './getCroppedImg.js';
import { useUser } from './UserContext';
import { Dialog, Transition } from '@headlessui/react';

const AvatarSelectionModal = ({ currentAvatar, onClose }) => {
  const { uploadAvatarImage, updateUserAvatar, refreshUserData } = useUser();

  const isCurrentPhoto = currentAvatar?.startsWith('http');
  const [selectedEmoji, setSelectedEmoji] = useState(!isCurrentPhoto ? currentAvatar : null);
  const [tab, setTab] = useState('emoji');
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageTooLarge, setImageTooLarge] = useState(false);

  const avatarOptions = [
    '😀', '😇', '😎', '🤓', '🥳', '🤖', '🐶', '🐱', '🦁', '🐼',
    '🌸', '🌍', '☀️', '🍕', '🍔', '⚽️', '🎮', '🎨', '🚀', '❤️'
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setImageTooLarge(true);
        return;
      }
      setImageTooLarge(false);
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      if (tab === 'emoji') {
        await updateUserAvatar(selectedEmoji);
      } else if (tab === 'photo' && imageSrc && croppedAreaPixels) {
        const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
        const uploadedUrl = await uploadAvatarImage(file);
        await updateUserAvatar(uploadedUrl);
      }

      await refreshUserData(); // ✅ recharge les données utilisateur
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'avatar:", error);
    }
    setUploading(false);
  };

  return (
    <Transition.Root show as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center px-2">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4">
              <Dialog.Title className="text-xl font-bold text-center text-gray-800 mb-3">
                Choisir un Avatar
              </Dialog.Title>

              <div className="flex justify-center gap-2 rounded-full bg-gray-100 px-2 py-1 mb-3 w-fit mx-auto">
                {['emoji', 'photo'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTab(type)}
                    className={`px-3 py-1 rounded-full font-semibold text-sm transition ${
                      tab === type ? 'bg-blue-600 text-white' : 'text-gray-700'
                    }`}
                  >
                    {type === 'emoji' ? 'Emoji' : 'Photo'}
                  </button>
                ))}
              </div>

              <div className="relative min-h-[160px]">
                <Transition
                  show={tab === 'emoji'}
                  enter="transition-opacity duration-300"
                  leave="transition-opacity duration-200"
                  className="absolute inset-0"
                >
                  <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                    {avatarOptions.map((avatar, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEmoji(avatar)}
                        className={`text-4xl p-1 rounded-lg transition ${
                          selectedEmoji === avatar ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-200'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </Transition>

                <Transition
                  show={tab === 'photo'}
                  enter="transition-opacity duration-300"
                  leave="transition-opacity duration-200"
                  className="absolute inset-0"
                >
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    {!imageSrc && (
                      <>
                        <label className="text-sm text-gray-700 font-medium">Choisir une image :</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </>
                    )}
                    {imageTooLarge && (
                      <p className="text-red-500 text-sm">L’image est trop volumineuse (max 5 Mo).</p>
                    )}
                    {imageSrc && (
                      <>
                        <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                          <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={handleCropComplete}
                          />
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(e.target.value)}
                          className="w-full"
                        />
                      </>
                    )}
                  </div>
                </Transition>
              </div>

              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-5 rounded-full shadow-md transition"
                >
                  {uploading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1.5 px-5 rounded-full shadow-md transition"
                >
                  Annuler
                </button>
              </div>

              <div className="mt-5 text-center">
                <span className="text-sm text-gray-500">Avatar actuel :</span>
                <div className="mt-2">
                  {currentAvatar ? (
                    currentAvatar.startsWith('http') ? (
                      <img
                        src={currentAvatar}
                        alt="avatar"
                        className="w-12 h-12 rounded-full mx-auto object-cover"
                      />
                    ) : (
                      <div className="text-4xl">{currentAvatar}</div>
                    )
                  ) : (
                    <div className="text-sm text-gray-400 italic mt-1">Aucun avatar</div>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AvatarSelectionModal;
