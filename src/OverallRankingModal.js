import React from 'react';
import ListAndInfoModal from './ListAndInfoModal';

const OverallRankingModal = ({ onClose, rankingData }) => {
  return (
    <ListAndInfoModal title="Classement Général" onClose={onClose} sizeClass="max-w-md sm:max-w-lg">
      {rankingData.length === 0 ? (
        <p className="text-center text-lightText text-md mt-4">Aucun participant classé pour le moment.</p>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
          {rankingData.map((user, index) => (
            <div
              key={user.uid}
              className={`flex items-center p-3 rounded-lg shadow-sm border ${
                index === 0
                  ? 'bg-podium-gold/20 border-podium-gold'
                  : index === 1
                  ? 'bg-podium-silver/20 border-podium-silver'
                  : index === 2
                  ? 'bg-podium-bronze/20 border-podium-bronze'
                  : 'bg-white border-neutralBg'
              }`}
            >
              <span className="font-bold text-lg text-primary mr-3 w-8 text-center">{index + 1}.</span>
              {user.Avatar && user.Avatar.startsWith('http') ? (
                <img src={user.Avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200" />
              ) : (
                <span className="text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 mr-3">
                  {user.Avatar || '👤'}
                </span>
              )}
              <div className="flex-1">
                <p className="font-semibold text-text text-md">{user.Nom_Participant}</p>
                <p className="text-lightText text-sm">Points: {user.Total_Points}</p>
              </div>
              <p className="font-bold text-lg text-accent ml-4">{user.Total_Points}</p>
            </div>
          ))}
        </div>
      )}
    </ListAndInfoModal>
  );
};

export default OverallRankingModal;
