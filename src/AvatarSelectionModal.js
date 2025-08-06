import React, { useState, Fragment } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './getCroppedImg.js';
import { useUser } from './UserContext';
import { Dialog, Transition } from '@headlessui/react';

const AvatarSelectionModal = ({ currentAvatar, onClose, onAvatarSelected, isOpen = true }) => {
  const { uploadAvatarImage } = useUser();

  const isCurrentPhoto = currentAvatar?.startsWith('http');
  const [selectedEmoji, setSelectedEmoji] = useState(!isCurrentPhoto ? currentAvatar : '😀');
  const [tab, setTab] = useState('emoji');
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageTooLarge, setImageTooLarge] = useState(false);

  const avatarOptions = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
  '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
  '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
  '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
  '😈', '👿', '👹', '🤡', '💩', '👻', '💀', '☠️', '👽',
  '👾', '🤖', '👀'
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

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      if (tab === 'emoji') {
        onAvatarSelected(selectedEmoji);
        onClose();
      } else if (tab === 'photo' && imageSrc && croppedAreaPixels) {
        const { blob } = await getCroppedImg(imageSrc, croppedAreaPixels);
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        const uploadedUrl = await uploadAvatarImage(file);
        onAvatarSelected(uploadedUrl);
        onClose();
      }
    } catch (error) {
      console.error("Erreur avatar:", error.message || error);
      alert("❌ Échec lors de l'enregistrement de l'avatar. Vérifie la taille ou le format.");
    }
    setUploading(false);
  };


  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1001]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm p-6">
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 text-center mb-4">
                  Choisir un avatar
                </Dialog.Title>

                <div className="flex justify-center gap-2 bg-gray-100 px-2 py-1 mb-4 rounded-full w-fit mx-auto">
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
                  {tab === 'emoji' ? (
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
                  ) : (
                    <div className="space-y-3">
                      {!imageSrc && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {imageTooLarge && (
                            <p className="text-red-500 text-sm">Image trop volumineuse (max 5 Mo).</p>
                          )}
                        </>
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
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-full shadow-md transition text-sm"
                  >
                    {uploading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={uploading}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-full shadow-md transition text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AvatarSelectionModal;
