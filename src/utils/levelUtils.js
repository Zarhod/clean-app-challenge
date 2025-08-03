export const calculateLevelAndXP = (currentXP) => {
  let level = 1;
  let xpNeededForNextLevel = 100;

  if (currentXP >= 100) {
    level = 2;
    xpNeededForNextLevel = 150;
  }
  if (currentXP >= 250) {
    level = 3;
    xpNeededForNextLevel = 250;
  }
  if (currentXP >= 500) {
    level = 4;
    xpNeededForNextLevel = 500;
  }
  if (currentXP >= 1000) {
    level = 5;
    xpNeededForNextLevel = 1000;
  }
  if (currentXP >= 2000) {
    level = Math.floor(currentXP / 100) + 1;
    xpNeededForNextLevel = 100;
  }

  return { level, xpNeededForNextLevel };
};
