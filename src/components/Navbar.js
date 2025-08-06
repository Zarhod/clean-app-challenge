import React, { useState, useEffect, useRef, useCallback } from "react";

const Navbar = ({
  activeMainView,
  setActiveMainView,
  currentUser,
  handleParticipantClick,
  isAdmin
}) => {
  const [activeButtonPos, setActiveButtonPos] = useState({ left: "0px", width: "0px" });
  const buttonsRef = useRef({});
  const containerRef = useRef(null);

  const updateActivePos = useCallback(() => {
    const activeBtn = buttonsRef.current[activeMainView];
    if (activeBtn) {
      const { offsetLeft, offsetWidth } = activeBtn;
      setActiveButtonPos({ left: `${offsetLeft}px`, width: `${offsetWidth}px` });
      if (containerRef.current) {
        containerRef.current.scrollTo({
          left: offsetLeft - 16,
          behavior: "smooth"
        });
      }
    }
  }, [activeMainView]);

  useEffect(() => {
    updateActivePos();
    window.addEventListener("resize", updateActivePos);
    return () => window.removeEventListener("resize", updateActivePos);
  }, [activeMainView, updateActivePos]);

  const navItems = [
    { key: "home", label: "Accueil", action: () => setActiveMainView("home") },
    { key: "completedTasks", label: "Tâches Terminées", action: () => setActiveMainView("completedTasks") },
    { key: "historicalPodiums", label: "Historique", action: () => setActiveMainView("historicalPodiums") },
    ...(currentUser
      ? [{
          key: "participantProfile",
          label: "Mon Profil",
          action: () =>
            handleParticipantClick({
              Nom_Participant: currentUser.displayName || currentUser.email
            })
        }]
      : []),
    ...(isAdmin
      ? [{
          key: "adminPanel",
          label: "Console Admin",
          action: () => setActiveMainView("adminPanel")
        }]
      : [])
  ];

  return (
    <nav className="w-full flex justify-center mb-6 sm:mb-8 px-4 sm:px-6">
      <div
        ref={containerRef}
        className="
          relative
          w-full max-w-screen-xl
          overflow-x-auto no-scrollbar
          bg-white/50 backdrop-blur-md border border-white/30 shadow-lg rounded-full
          mx-auto
        "
        style={{ WebkitOverflowScrolling: "touch" }} // scroll fluide iOS
      >
        <div
          className="
            flex items-center gap-2 sm:gap-4
            min-w-max
            px-4 sm:px-6 py-1
            justify-start
            relative
          "
        >
          {/* Curseur animé */}
          <div
            className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-md
                        ${activeMainView === "adminPanel" ? "bg-red-500" : "bg-primary/90"}`}
            style={{
              left: activeButtonPos.left,
              width: activeButtonPos.width
            }}
          />
          {navItems.map((item) => {
            const isActive = activeMainView === item.key;
            const isAdminPanel = item.key === "adminPanel";
            return (
              <button
                key={item.key}
                ref={(el) => (buttonsRef.current[item.key] = el)}
                onClick={() => {
                  item.action();
                  updateActivePos();
                }}
                className={`relative z-10 py-2 px-4 sm:px-6 whitespace-nowrap rounded-full font-bold text-sm 
                            transition duration-300 ease-in-out flex-shrink-0
                            ${
                              isActive
                                ? "text-white"
                                : isAdminPanel
                                ? "text-red-500 hover:text-red-600"
                                : "text-gray-700 hover:text-primary"
                            }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
