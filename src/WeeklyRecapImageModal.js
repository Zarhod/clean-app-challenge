import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const WeeklyRecapImageModal = ({ isOpen, onClose, recapData }) => {
  const recapRef = useRef();

  const handleDownloadImage = async () => {
    if (!recapRef.current) return;
    const canvas = await html2canvas(recapRef.current, { scale: 2, useCORS: true });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `recap-${recapData?.weekRange || 'sauvegarde'}.png`;
    link.click();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 blur-sm"
          enterTo="opacity-100 blur-none"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 blur-none"
          leaveTo="opacity-0 blur-sm"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-200"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="relative bg-transparent w-full max-w-6xl rounded-2xl p-0 overflow-visible shadow-none">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl z-10"
                >
                  ✕
                </button>

                {!recapData ? (
                  <div className="bg-[#171b29] rounded-2xl py-24 px-6 text-center w-[95vw] max-w-lg mx-auto shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Aucune donnée disponible 🕓</h2>
                    <p className="text-base text-blue-200">
                      La collecte des données de la semaine précédente n’a pas encore été effectuée.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow hover:bg-blue-700 transition"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="text-center my-6">
                      <button
                        onClick={handleDownloadImage}
                        className="px-5 py-2 bg-blue-700 text-white font-bold rounded-full shadow-lg hover:bg-blue-800 transition"
                      >
                        📸 Télécharger l'image
                      </button>
                    </div>

                    {/* IMAGE FORMAT 1080x1680 */}
                    <div
                      ref={recapRef}
                      className="relative bg-gradient-to-br from-[#181f3a] via-[#151a2f] to-[#26143b] rounded-3xl flex flex-col items-center justify-between shadow-2xl border-[5px] border-[#354072]"
                      style={{
                        width: 1080,
                        height: 1680,
                        padding: '70px 56px 40px 56px',
                        boxSizing: 'border-box',
                        fontFamily: 'Inter, Arial, sans-serif',
                        minWidth: 0,
                        minHeight: 0,
                      }}
                    >
                      <div className="flex-1 flex flex-col justify-between w-full h-full">
                        {/* Titre principal */}
                        <h1 className="text-[4rem] leading-none font-extrabold text-[#a5c9ff] text-center mb-4 drop-shadow-2xl tracking-tight">
                          RÉCAP DE LA SEMAINE
                        </h1>
                        <div className="text-2xl sm:text-3xl font-bold text-[#a5c9ff] mb-8 text-center tracking-wide">
                          {recapData.weekRange || "du ... au ..."}
                        </div>

                        {/* Sections regroupées sur toute la hauteur ! */}
                        <div className="flex flex-wrap gap-10 w-full justify-center items-stretch">
                          {/* Podium */}
                          <div className="flex-1 min-w-[330px] max-w-[380px] rounded-2xl border-2 border-[#5897fa] bg-[#232b47]/80 px-8 py-7 shadow-lg flex flex-col">
                            <h2 className="text-3xl font-bold text-[#a5c9ff] mb-4 text-center">Podium</h2>
                            {recapData.podium.map((p, i) => (
                              <div key={i} className="flex items-center gap-4 mb-2">
                                <span className={`
                                  inline-block text-2xl font-bold rounded-full w-10 h-10 flex items-center justify-center
                                  ${i === 0 ? 'bg-blue-400 text-white' : i === 1 ? 'bg-slate-300 text-blue-800' : 'bg-orange-300 text-orange-900'}
                                `}>
                                  {i + 1}
                                </span>
                                <span className="flex-1 text-xl font-bold text-white">{p.name}</span>
                                <span className="text-lg font-semibold text-[#b6e5ff]">{p.points} pts</span>
                              </div>
                            ))}
                          </div>
                          {/* Tendances */}
                          <div className="flex-1 min-w-[330px] max-w-[380px] rounded-2xl border-2 border-[#c57fff] bg-[#251d3e]/80 px-8 py-7 shadow-lg flex flex-col">
                            <h2 className="text-3xl font-bold text-[#e8aaff] mb-4 text-center">Tendances</h2>
                            <ul className="text-lg text-white space-y-1">
                              <li>• Plus actif : <span className="font-bold text-[#92ffe1]">{recapData.mostActive.name}</span> ({recapData.mostActive.count} tâches)</li>
                              <li>• Plus amélioré : <span className="font-bold text-[#ffd299]">{recapData.mostImproved.name}</span> (+{recapData.mostImproved.delta} pts)</li>
                              <li>• Nouveau : <span className="font-bold text-[#7cd5ff]">{recapData.newParticipant.name}</span> (1<sup>ère</sup> semaine)</li>
                            </ul>
                          </div>
                        </div>
                        {/* Stats clés + Comparatif */}
                        <div className="flex flex-wrap gap-10 w-full justify-center items-stretch mt-10">
                          {/* Stats clés */}
                          <div className="flex-1 min-w-[330px] max-w-[380px] rounded-2xl border-2 border-[#5897fa] bg-[#232b47]/80 px-8 py-7 shadow-lg flex flex-col">
                            <h2 className="text-2xl font-bold text-[#a5c9ff] mb-4 text-center">Stats clés</h2>
                            <ul className="text-lg text-white space-y-1">
                              <li>• Total tâches : <span className="font-bold">{recapData.totalTasks}</span></li>
                              <li>• Points distribués : <span className="font-bold">{recapData.totalPoints}</span></li>
                              <li>• Moyenne joueur : <span className="font-bold">{recapData.averagePoints}</span></li>
                              <li>• Tâches quotidiennes : <span className="font-bold">{recapData.dailyTasks}</span></li>
                              <li>• Tâches hebdos : <span className="font-bold">{recapData.weeklyTasks}</span></li>
                            </ul>
                          </div>
                          {/* Comparatif */}
                          <div className="flex-1 min-w-[330px] max-w-[380px] rounded-2xl border-2 border-[#c57fff] bg-[#251d3e]/80 px-8 py-7 shadow-lg flex flex-col">
                            <h2 className="text-2xl font-bold text-[#e8aaff] mb-4 text-center">Comparaison<br />avec la semaine précédente</h2>
                            <ul className="text-lg text-white space-y-2 mt-2">
                              <li>
                                <span className={`font-bold ${recapData.comparison.engagement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {recapData.comparison.engagement >= 0 ? '↑' : '↓'} Engagement : {Math.abs(recapData.comparison.engagement)}%
                                </span>
                              </li>
                              <li>
                                <span className={`font-bold ${recapData.comparison.tasks >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {recapData.comparison.tasks >= 0 ? '↑' : '↓'} Tâches : {Math.abs(recapData.comparison.tasks)}%
                                </span>
                              </li>
                              <li>
                                <span className={`font-bold ${recapData.comparison.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {recapData.comparison.points >= 0 ? '↑' : '↓'} Points : {Math.abs(recapData.comparison.points)}%
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        {/* Footer */}
                        <div className="mt-12 w-full flex justify-center">
                          <span className="text-3xl font-bold text-[#87b6ff] tracking-wider drop-shadow-xl">#TeamCleanApp</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default WeeklyRecapImageModal;
