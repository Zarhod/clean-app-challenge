import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const ConfettiOverlay = ({ show, duration = 3000, onComplete }) => {
  const animationInstance = useRef(null);

  useEffect(() => {
    if (show) {
      // Initialise l'instance de confetti
      animationInstance.current = confetti.create(null, {
        resize: true,
        useWorker: true
      });

      const fireConfetti = () => {
        if (animationInstance.current) {
          animationInstance.current({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      };

      // Tire des confettis plusieurs fois pour un effet plus dense
      const interval = setInterval(fireConfetti, 200);
      fireConfetti(); // Tire une première fois immédiatement

      const timer = setTimeout(() => {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }, duration);

      // Nettoyage à la fin de l'effet ou au démontage du composant
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
        if (animationInstance.current) {
          animationInstance.current.reset(); // Réinitialise l'instance de confetti
        }
      };
    }
  }, [show, duration, onComplete]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      {/* Le canvas est créé par canvas-confetti directement, pas besoin de le rendre ici */}
    </div>
  );
};

export default ConfettiOverlay;
