import React from 'react';
import { Dialog } from '@headlessui/react';

function RankingCardModal({ show, onClose, title, participants, type, onParticipantClick }) {
  if (!show || !participants || participants.length === 0) return null;

  const isWeekly = type === 'weekly';

  const getBgColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-podium-gold/20';
      case 2:
        return 'bg-podium-silver/20';
      case 3:
        return 'bg-podium-bronze/20';
      default:
        return 'bg-neutralBg';
    }
  };

  const getColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-podium-gold';
      case 2:
        return 'text-podium-silver';
      case 3:
        return 'text-podium-bronze';
      default:
        return 'text-text';
    }
  };

  return (
    <Dialog open={show} onClose={onClose} className="relative z-[1200]">
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in pointer-events-auto flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-center text-xl sm:text-2xl font-extrabold text-primary">
              {title || 'Classement Complet'}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {participants.map((participant, index) => {
              const rank = index + 1;
              const score = isWeekly
                ? participant.Points_Total_Semaine_Courante
                : participant.Points_Total_Cumulatif;

              return (
                <div
                  key={participant.Nom_Participant + rank}
                  onClick={() => onParticipantClick?.(participant)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl shadow-sm border border-primary/10 cursor-pointer hover:scale-[1.01] transition transform duration-200 ease-in-out ${getBgColor(rank)}`}
                >
                  <span className={`text-3xl font-extrabold w-8 text-right ${getColor(rank)}`}>{rank}.</span>

                  {participant.Avatar?.startsWith('http') ? (
                    <img
                      src={participant.Avatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <span className="text-4xl">{participant.Avatar || '👤'}</span>
                  )}

                  <div className="flex-grow">
                    <p className="font-bold text-base text-secondary truncate">{participant.Nom_Participant}</p>
                    <p className="text-sm text-text">
                      {isWeekly ? 'Points Semaine:' : 'Points Cumulatifs:'}{' '}
                      <span className="font-semibold text-primary">{score}</span>
                    </p>
                    <p className="text-sm text-text">
                      Niveau: <span className="font-semibold text-primary">{participant.Level || 1}</span> | XP:{' '}
                      <span className="font-semibold text-primary">{participant.XP || 0}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-full text-sm font-semibold text-white bg-error hover:bg-red-700 transition shadow-md"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default RankingCardModal;
