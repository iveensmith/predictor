const getResult = (home, away) => {
  if (home === away) return "draw";
  return home > away ? "home" : "away";
};

const scorePrediction = ({ predictedHome, predictedAway, actualHome, actualAway }) => {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 10;
  }

  const predictedResult = getResult(predictedHome, predictedAway);
  const actualResult = getResult(actualHome, actualAway);
  return predictedResult === actualResult ? 5 : 0;
};

module.exports = {
  scorePrediction,
};
