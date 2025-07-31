import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useUser } from './UserContext'; // Pour db et currentUser

const ReportTaskModal = ({ onClose, taskDetails }) => {
  const { db, currentUser } = useUser();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!reason.trim()) {
      toast.error("Veuillez sélectionner une raison.");
      setLoading(false);
      return;
    }
    if (!details.trim()) {
      toast.error("Veuillez fournir plus de détails.");
      setLoading(false);
      return;
    }
    if (!currentUser) {
      toast.error("Vous devez être connecté pour signaler une tâche.");
      setLoading(false);
      return;
    }
    if (!db) {
      toast.error("Base de données non disponible.");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'reported_tasks'), {
        reporterId: currentUser.uid,
        reporterDisplayName: currentUser.displayName || currentUser.email,
        taskId: taskDetails.taskId || 'N/A', // ID de la tâche signalée
        taskName: taskDetails.taskName || 'N/A', // Nom de la tâche signalée
        realisationId: taskDetails.realisationId || null, // ID de la réalisation si applicable
        reason: reason,
        details: details,
        timestamp: serverTimestamp(),
        status: 'pending', // statut initial du signalement
      });
      toast.success("Votre signalement a été envoyé avec succès. Nous l'examinerons bientôt.");
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'envoi du signalement:", error);
      toast.error("Erreur lors de l'envoi du signalement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1000] p-4">
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md animate-fade-in-scale border border-primary/20 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 text-center">
          Signaler une Tâche/Réalisation
        </h3>

        {taskDetails && (
          <div className="mb-4 p-3 bg-neutralBg rounded-lg border border-gray-200 text-sm text-text">
            <p className="font-semibold">Tâche concernée : {taskDetails.taskName}</p>
            {taskDetails.realisationId && (
              <p className="text-lightText">Réalisation ID : {taskDetails.realisationId}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-text text-left mb-1">Raison du signalement</label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
              disabled={loading}
            >
              <option value="">Sélectionnez une raison</option>
              <option value="Information incorrecte">Information incorrecte</option>
              <option value="Points incorrects">Points incorrects</option>
              <option value="Duplication">Duplication</option>
              <option value="Non applicable">Non applicable</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label htmlFor="details" className="block text-sm font-medium text-text text-left mb-1">Détails supplémentaires</label>
            <textarea
              id="details"
              rows="4"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y custom-scrollbar"
              required
              disabled={loading}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-error hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin-fast mr-2"></div>
                Envoi du signalement...
              </div>
            ) : (
              'Envoyer le Signalement'
            )}
          </button>
        </form>

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-md"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default ReportTaskModal;
