const API_BASE = "http://localhost:3000";

const state = {
  telegramId: "demo-user",
};

const qs = (selector) => document.querySelector(selector);

const renderMatches = (matches) => {
  const container = qs("#matches");
  container.innerHTML = "";

  matches.forEach((match) => {
    const card = document.createElement("div");
    card.className = "match";
    card.innerHTML = `
      <div class="match__teams">
        <span>${match.home_team}</span>
        <span>${new Date(match.kickoff_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>${match.away_team}</span>
      </div>
      <div class="match__inputs">
        <input type="number" min="0" max="9" placeholder="0" id="home-${match.id}" />
        <span>:</span>
        <input type="number" min="0" max="9" placeholder="0" id="away-${match.id}" />
      </div>
      <div class="buttons">
        <button class="primary" data-match="${match.id}">Lock Prediction</button>
        <button class="secondary" data-boost="${match.id}">Use Boost</button>
      </div>
    `;
    container.appendChild(card);
  });
};

const updateProfile = (profile) => {
  qs("#username").textContent = profile.username ? `@${profile.username}` : "@player";
  qs("#points").textContent = profile.total_points || 0;
  qs("#boost-tokens").textContent = profile.boost_tokens || 0;
  qs("#daily-limit").textContent = profile.daily_limit || 5;
  qs("#predictions-today").textContent = profile.predictions_today || 0;
  const percent = Math.min(
    100,
    ((profile.predictions_today || 0) / (profile.daily_limit || 5)) * 100
  );
  qs("#daily-progress").style.width = `${percent}%`;
  qs("#referral-code").textContent = profile.referral_code || "MP-XXXX";
};

const renderLeaderboard = (data) => {
  const list = qs("#leaderboard");
  list.innerHTML = "";
  data.leaderboard.forEach((row, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>#${index + 1} ${row.username || "player"}</span><span>${row.points} pts</span>`;
    list.appendChild(li);
  });
};

const loadMatches = async () => {
  const response = await fetch(`${API_BASE}/api/matches`);
  const matches = await response.json();
  renderMatches(matches);
};

const loadProfile = async () => {
  const response = await fetch(`${API_BASE}/api/profile/${state.telegramId}`);
  if (response.ok) {
    const profile = await response.json();
    updateProfile(profile);
  }
};

const loadLeaderboard = async () => {
  const response = await fetch(`${API_BASE}/api/leaderboard/weekly`);
  if (!response.ok) return;
  const data = await response.json();
  renderLeaderboard(data);
};

const bindPredictionButtons = () => {
  qs("#matches").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const matchId = button.dataset.match || button.dataset.boost;
    const useBoost = Boolean(button.dataset.boost);
    const predictedHome = Number(qs(`#home-${matchId}`).value || 0);
    const predictedAway = Number(qs(`#away-${matchId}`).value || 0);

    const response = await fetch(`${API_BASE}/api/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: state.telegramId,
        matchId: Number(matchId),
        predictedHome,
        predictedAway,
        useBoost,
      }),
    });

    const result = await response.json();
    alert(result.message || result.error);
    loadProfile();
  });
};

const bootstrap = async () => {
  await loadProfile();
  await loadMatches();
  await loadLeaderboard();
  bindPredictionButtons();
};

bootstrap();
