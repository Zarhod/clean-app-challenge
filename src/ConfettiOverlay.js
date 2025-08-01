import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti'; // We'll use a simple confetti library

// Ensure you have installed 'canvas-confetti':
// npm install canvas-confetti

function ConfettiOverlay({ show, onComplete }) {
  const animationInstance = useRef(null);

  useEffect(() => {
    if (show) {
      // Initialize confetti only once
      if (!animationInstance.current) {
        animationInstance.current = confetti.create(null, {
          resize: true,
          useWorker: true // Use web worker for better performance
        });
      }

      // Fire confetti
      animationInstance.current({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94', '#6a0dad', '#800080', '#ffc0cb', '#0000ff'] // Custom colors
      });

      // Stop confetti after a short delay
      const timer = setTimeout(() => {
        if (animationInstance.current) {
          animationInstance.current.reset(); // Clear confetti
        }
        onComplete(); // Notify parent that animation is complete
      }, 2000); // Confetti lasts for 2 seconds

      return () => {
        clearTimeout(timer);
        if (animationInstance.current) {
          animationInstance.current.reset(); // Clean up on unmount
        }
      };
    }
  }, [show, onComplete]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Confetti will render on the canvas created by the library */}
    </div>
  );
}

export default ConfettiOverlay;
