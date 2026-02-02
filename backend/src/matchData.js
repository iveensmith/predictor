const path = require("path");
const fs = require("fs");

const SAMPLE_MATCHES_PATH = path.join(__dirname, "..", "..", "data", "sample-matches.json");

const loadSampleMatches = () => {
  const raw = fs.readFileSync(SAMPLE_MATCHES_PATH, "utf-8");
  return JSON.parse(raw);
};

module.exports = {
  loadSampleMatches,
};
