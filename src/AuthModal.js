// src/AuthModal.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Importe le contexte utilisateur pour accéder à Supabase
import ImageCropperModal from './ImageCropperModal'; // Importe le nouveau composant de recadrage
import { readFile } from './ImageCropperModal'; // Importe la fonction readFile du cropper

// Liste d'emojis pour la sélection d'avatar
const emojis = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😎', '🤩', '🥳',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐒', '🐔',
  '🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥭', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣',
  '🚀', '🛸', '🛰️', '🚁', '🚂', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚌', '🚍', '🚎', '🚐', '🚑',
  '🏠', '🏡', '🏘️', '🏢', '🏣', '🏥', '🏦', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼',
  '💡', '⏰', '⏳', '⌚', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📸', '📹', '🎥', '🎙️', '🎧',
  '📚', '📖', '📝', '✏️', '🖍️', '🖌️', '📏', '📐', '✂️', '📌', '📎', '🔗', '🔓', '🔒', '🔑', '🗝️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'
];

const AuthModal = ({ onClose }) => {
  const { supabase, signUp: supabaseSignUp, signIn: supabaseSignIn } = useUser(); // Récupère les fonctions d'auth du contexte
  const [isLogin, setIsLogin] = useState(true); // true pour connexion, false pour inscription
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // États pour la sélection d'avatar lors de l'inscription
  const [registrationAvatarType, setRegistrationAvatarType] = useState('emoji'); // 'emoji' ou 'upload'
  const [selectedRegistrationEmoji, setSelectedRegistrationEmoji] = useState('😀');
  const [registrationAvatarFile, setRegistrationAvatarFile] = useState(null); // Le Blob de l'image (recadrée)
  const [registrationAvatarPreviewUrl, setRegistrationAvatarPreviewUrl] = useState(null); // URL pour l'aperçu

  // États pour le recadrage d'image
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCropUrl, setImageToCropUrl] = useState(null);


  // Effet pour réinitialiser les champs quand le type d'authentification change
  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName(''); // Toujours réinitialiser le nom d'affichage lors du changement de mode
    // Libère l'URL précédente si elle existe
    if (registrationAvatarPreviewUrl) {
      URL.revokeObjectURL(registrationAvatarPreviewUrl);
    }
    setRegistrationAvatarPreviewUrl(null);
    setRegistrationAvatarFile(null);
    setSelectedRegistrationEmoji('😀'); // Réinitialise à l'emoji par défaut
    setRegistrationAvatarType('emoji'); // Revient au type emoji par défaut
    setImageToCropUrl(null);
    setShowImageCropper(false);
  }, [isLogin, registrationAvatarPreviewUrl]); // Ajout de registrationAvatarPreviewUrl

  // Nettoyage des Object URLs lors du démontage du composant ou si l'URL change
  useEffect(() => {
    return () => {
      if (registrationAvatarPreviewUrl) {
        URL.revokeObjectURL(registrationAvatarPreviewUrl);
      }
    };
  }, [registrationAvatarPreviewUrl]); // Dépendance à registrationAvatarPreviewUrl pour le nettoyage spécifique


  const handleRegistrationFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("La taille de l'image ne doit pas dépasser 2 Mo.");
        e.target.value = null; // Réinitialise l'input file
        setRegistrationAvatarFile(null);
        if (registrationAvatarPreviewUrl) URL.revokeObjectURL(registrationAvatarPreviewUrl);
        setRegistrationAvatarPreviewUrl(null);
        return;
      }
      try {
        const imageDataUrl = await readFile(selectedFile);
        setImageToCropUrl(imageDataUrl); // Charge l'image dans le cropper
        setShowImageCropper(true); // Ouvre la modale de recadrage
        setSelectedRegistrationEmoji(null); // Désélectionne l'emoji pour que l'image prenne le dessus
        setRegistrationAvatarType('upload'); // S'assure que le type est bien 'upload'
      } catch (error) {
        toast.error("Erreur lors de la lecture du fichier image.");
        console.error("Error reading image file:", error);
        setRegistrationAvatarFile(null);
        if (registrationAvatarPreviewUrl) URL.revokeObjectURL(registrationAvatarPreviewUrl);
        setRegistrationAvatarPreviewUrl(null);
      }
    } else {
      setRegistrationAvatarFile(null);
      if (registrationAvatarPreviewUrl) URL.revokeObjectURL(registrationAvatarPreviewUrl);
      setRegistrationAvatarPreviewUrl(null);
    }
  };

  const handleCroppedImage = useCallback((croppedBlob) => {
    setRegistrationAvatarFile(croppedBlob);
    // Créer une URL pour l'aperçu à partir du Blob recadré
    if (registrationAvatarPreviewUrl) {
      URL.revokeObjectURL(registrationAvatarPreviewUrl); // Libère l'ancienne URL si elle existe
    }
    const previewUrl = URL.createObjectURL(croppedBlob);
    setRegistrationAvatarPreviewUrl(previewUrl);
    setSelectedRegistrationEmoji(null); // S'assurer que l'emoji est bien null quand il y a une image
    setRegistrationAvatarType('upload'); // Garde le type 'upload' après le recadrage
    setShowImageCropper(false); // Ferme le cropper
    setImageToCropUrl(null); // Réinitialise l'URL de l'image à recadrer
  }, [registrationAvatarPreviewUrl]); // Ajout de registrationAvatarPreviewUrl aux dépendances

  const handleCancelCrop = useCallback(() => {
    setShowImageCropper(false);
    setImageToCropUrl(null);
    // Si l'utilisateur annule le recadrage, on revient à l'état précédent de l'avatar
    // Si une image était déjà sélectionnée (avant le recadrage), on la garde.
    // Sinon, on revient à l'emoji par défaut.
    if (!registrationAvatarFile) { // Si aucun fichier n'était en cours avant le recadrage
      setSelectedRegistrationEmoji('😀'); // Revenir à l'emoji par défaut
      setRegistrationAvatarType('emoji');
    }
    // Si registrationAvatarFile existait, registrationAvatarPreviewUrl devrait déjà être là
    // et on ne le réinitialise pas ici pour le maintenir.
  }, [registrationAvatarFile]);


  const handleAuthAction = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // Tente de se connecter
        const { error } = await supabaseSignIn(email, password);

        if (error) {
          // Gère les erreurs spécifiques de Supabase Auth
          if (error.message.includes("Email not confirmed")) {
            toast.error("Votre email n'est pas confirmé. Veuillez vérifier votre boîte de réception pour activer votre compte.");
          } else if (error.message.includes("Invalid login credentials")) {
            // Tente de vérifier si l'email existe dans la table 'users' pour un message plus précis
            const { data: users, error: userCheckError } = await supabase
              .from('users')
              .select('id')
              .eq('email', email);

            if (userCheckError) {
              // Erreur lors de la vérification de l'email, affiche un message générique
              toast.error("Erreur lors de la vérification de l'email.");
            } else if (users.length === 0) {
              // L'email n'existe pas dans notre table 'users'
              toast.info("Pas de compte. Veuillez vous inscrire.");
            } else {
              // L'email existe, mais les identifiants sont incorrects (mauvais mot de passe)
              toast.error("Email ou mot de passe incorrect.");
            }
          } else {
            // Pour toute autre erreur d'authentification non gérée spécifiquement
            toast.error(`Erreur d'authentification: ${error.message}`);
          }
        } else {
          toast.success("Connexion réussie !");
          onClose(); // Ferme la modale après succès
        }
      } else {
        // --- Processus d'inscription ---
        // 1. Tente d'inscrire l'utilisateur
        const { data, error: signUpError } = await supabaseSignUp(email, password, displayName, selectedRegistrationEmoji);

        if (signUpError) {
          if (signUpError.message.includes("User already registered")) {
            toast.error("Cet email est déjà enregistré. Veuillez vous connecter.");
            setIsLogin(true); // Bascule vers le mode connexion si l'utilisateur existe déjà
          } else {
            toast.error(`Erreur d'inscription: ${signUpError.message}`);
          }
          setLoading(false);
          return; // Arrête le processus si l'inscription échoue
        }

        // Si l'inscription réussit, l'utilisateur est automatiquement connecté
        // et nous pouvons maintenant gérer l'upload de l'avatar s'il y en a un.
        let finalAvatarUrl = selectedRegistrationEmoji; // Par défaut, l'emoji sélectionné

        // Si un fichier d'avatar a été sélectionné et recadré
        if (registrationAvatarFile && data.user) { // Vérifie qu'il y a un fichier et un utilisateur
          const fileExt = registrationAvatarFile.type.split('/').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${fileName}`;

          try {
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, registrationAvatarFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: registrationAvatarFile.type
              });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            
            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("Impossible de récupérer l'URL publique de l'avatar.");
            }
            finalAvatarUrl = publicUrlData.publicUrl;

            // Mettre à jour le profil de l'utilisateur avec l'URL de l'avatar
            // Note: user_metadata est mis à jour ici, mais le UserContext.js
            // se chargera de mettre à jour la table public.users
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                avatar_url: finalAvatarUrl
              }
            });

            if (updateError) {
              console.error("Erreur lors de la mise à jour de l'avatar de l'utilisateur (user_metadata):", updateError.message);
              toast.error("Inscription réussie, mais erreur lors de la mise à jour de l'avatar dans le profil.");
            }

          } catch (uploadOrUpdateError) {
              console.error("Erreur lors de l'upload ou de la mise à jour de l'avatar (storage):", uploadOrUpdateError.message);
              toast.error("Inscription réussie, mais erreur lors de l'upload de l'avatar. Vérifiez les politiques de sécurité du stockage Supabase.");
              // Ne pas retourner ici, l'inscription a réussi même si l'avatar a échoué
          }
        }

        toast.success("Inscription réussie ! Vous êtes maintenant connecté.");
        onClose(); // Ferme la modale après succès

      }
    } catch (error) {
      console.error("Erreur d'authentification générale:", error.message);
      let errorMessage = "Une erreur inattendue est survenue.";
      if (error.message.includes("Email rate limit exceeded")) {
        errorMessage = "Trop de tentatives de connexion/inscription. Veuillez réessayer plus tard.";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (error.message.includes("Unable to validate email address: invalid format")) {
        errorMessage = "Format d'email invalide.";
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in-scale border border-primary/20 mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-text text-left font-medium mb-2 text-sm">Nom d'affichage</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom ou pseudo"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-text text-left font-medium mb-2 text-sm">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@example.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-text text-left font-medium mb-2 text-sm">Mot de passe</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
              required
            />
            {/* Icônes Lucide React pour une meilleure cohérence visuelle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-7"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off text-gray-500 hover:text-gray-700"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.76 9.76 0 0 0 4.7-1.24"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye text-gray-500 hover:text-gray-700"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {/* Section de sélection d'avatar pour l'inscription */}
          {!isLogin && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-xl font-semibold text-text mb-3">Choisir votre Avatar</h3>
              <div className="mb-4">
                <p className="text-lg text-text font-semibold mb-3">Aperçu :</p>
                <div className="w-24 h-24 mx-auto rounded-full bg-neutralBg flex items-center justify-center text-5xl border-2 border-primary overflow-hidden">
                  {/* Utilise la clé pour forcer le re-rendu de l'image */}
                  {registrationAvatarPreviewUrl ? (
                      <img key={registrationAvatarPreviewUrl} src={registrationAvatarPreviewUrl} alt="Aperçu de l'avatar" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-5xl">{selectedRegistrationEmoji}</span>
                  )}
                </div>
              </div>

              {/* Sélecteur Photo / Emoji */}
              <div className="flex justify-center mb-4 bg-neutralBg rounded-full p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationAvatarType('emoji');
                    // Si on bascule sur emoji, on efface l'image précédemment sélectionnée
                    setRegistrationAvatarFile(null);
                    if (registrationAvatarPreviewUrl) URL.revokeObjectURL(registrationAvatarPreviewUrl);
                    setRegistrationAvatarPreviewUrl(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-full font-semibold text-sm transition duration-300
                              ${registrationAvatarType === 'emoji' ? 'bg-primary text-white shadow-md' : 'text-text hover:bg-gray-200'}`}
                >
                  Emoji
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationAvatarType('upload');
                    // Si on bascule sur upload, on s'assure que l'emoji n'est pas sélectionné
                    setSelectedRegistrationEmoji(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-full font-semibold text-sm transition duration-300
                              ${registrationAvatarType === 'upload' ? 'bg-primary text-white shadow-md' : 'text-text hover:bg-gray-200'}`}
                >
                  Photo
                </button>
              </div>

              {registrationAvatarType === 'emoji' ? (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-text mb-2">Sélectionner un Emoji :</h4>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1 rounded-lg bg-neutralBg">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedRegistrationEmoji(emoji);
                          setRegistrationAvatarFile(null);
                          if (registrationAvatarPreviewUrl) URL.revokeObjectURL(registrationAvatarPreviewUrl); // Libère l'URL si elle existe
                          setRegistrationAvatarPreviewUrl(null); // Clear preview for image
                        }}
                        className={`p-1 rounded-full text-2xl transition duration-150 hover:bg-primary/20 
                                    ${selectedRegistrationEmoji === emoji ? 'bg-primary/40' : 'bg-transparent'}`}
                        disabled={loading}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-text mb-2">Télécharger une Image (Max 2MB) :</h4>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRegistrationFileChange}
                    className="w-full text-sm text-text file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0 file:text-sm file:font-semibold
                               file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleAuthAction}
            disabled={loading || !email || !password || (!isLogin && (!displayName || (!selectedRegistrationEmoji && !registrationAvatarFile)))}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-full shadow-lg 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-full shadow-md 
                       transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-transparent hover:bg-gray-100 text-gray-600 font-semibold py-2 px-4 rounded-full 
                       transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* Modale de recadrage d'image */}
      {showImageCropper && imageToCropUrl && (
        <ImageCropperModal
          imageSrc={imageToCropUrl}
          onClose={handleCancelCrop} // Utilise la nouvelle fonction de gestion de l'annulation
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default AuthModal;
