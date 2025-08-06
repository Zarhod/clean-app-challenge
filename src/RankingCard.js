import React from 'react';
import { Dialog } from '@headlessui/react';
import { Star, Award, User } from 'react-feather';

function RankingCardModal({ show, onClose, title, participants = [], type, onParticipantClick }) {
  if (!show || !participants.length) return null;

  const isWeekly = type === 'weekly';

  // Filtrer participants pour ne garder que ceux avec points > 0
  const filteredParticipants = participants.filter(p =>
    (isWeekly ? Number(p.Points_Total_Semaine_Courante) : Number(p.Points_Total_Cumulatif)) > 0
  );

  if (filteredParticipants.length === 0) return null;

  const podiumColors = {
    1: { bg: 'bg-podium-gold/30', text: 'text-podium-gold' },
    2: { bg: 'bg-podium-silver/25', text: 'text-podium-silver' },
    3: { bg: 'bg-podium-bronze/25', text: 'text-podium-bronze' },
  };

  return (
    <Dialog open={show} onClose={onClose} className="relative z-[1200]">
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in flex flex-col">

          {/* Header */}
          <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-center text-xl sm:text-2xl font-extrabold text-primary select-none">
              {title || 'Classement Complet'}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
            {filteredParticipants.map((participant, index) => {
              const rank = index + 1;
              const score = isWeekly
                ? participant.Points_Total_Semaine_Courante
                : participant.Points_Total_Cumulatif;
              const podium = podiumColors[rank] || { bg: 'bg-neutralBg', text: 'text-text' };

              return (
                <div
                  key={`${participant.Nom_Participant}-${rank}`}
                  onClick={() => onParticipantClick?.(participant)}
                  className={`flex items-center gap-4 p-4 rounded-3xl shadow hover:shadow-lg border border-transparent hover:border-primary cursor-pointer transition-transform transform duration-200 ease-in-out ${podium.bg}`}
                >
                  {/* Rang avec cercle coloré */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-extrabold text-lg ${podium.text} select-none`}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  {participant.Avatar?.startsWith('http') ? (
                    <img
                      src={participant.Avatar}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 text-3xl text-gray-400 border-2 border-white shadow-sm">
                      {participant.Avatar || '👤'}
                    </div>
                  )}

                  {/* Infos participant */}
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-lg text-secondary truncate">{participant.Nom_Participant}</p>

                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-text select-none">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" />
                        <span>
                          {isWeekly ? 'Points Semaine:' : 'Points Cumulatifs:'}{' '}
                          <span className="font-semibold text-primary">{score}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Award size={14} className="text-indigo-500" />
                        <span>
                          Niveau: <span className="font-semibold text-primary">{participant.Level || 1}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <User size={14} className="text-blue-400" />
                        <span>
                          XP: <span className="font-semibold text-primary">{participant.XP || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-white">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full text-sm font-semibold text-white bg-error hover:bg-red-700 transition shadow-md"
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
