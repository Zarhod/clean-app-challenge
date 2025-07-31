import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

function ConfettiOverlay({ show, onComplete }) {
  const animationInstance = useRef(null);

  useEffect(() => {
    if (show) {
      if (!animationInstance.current) {
        animationInstance.current = confetti.create(null, {
          resize: true,
          useWorker: true
        });
      }

      animationInstance.current({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#6a0dad', '#800080', '#ffc0cb', '#0000ff']
      });

      const timer = setTimeout(() => {
        if (animationInstance.current) {
          animationInstance.current.reset();
        }
        onComplete();
      }, 2000);

      return () => {
        clearTimeout(timer);
        if (animationInstance.current) {
          animationInstance.current.reset();
        }
      };
    }
  }, [show, onComplete]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]"></div>
  );
}

export default ConfettiOverlay;
