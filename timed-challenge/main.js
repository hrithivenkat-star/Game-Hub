let timeLeft = 60; // starting time
let score = 0;
let timerInterval;
let currentGameIndex = 0;
const games = ["reaction-rush", "memory-flip", "escape-dash"]; // game folders

function startChallenge() {
  document.getElementById("start-btn").style.display = "none";
  loadGame(games[currentGameIndex]);
  startTimer();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endChallenge();
    }
  }, 1000);
}

function addScore(points) {
  score += points;
  document.getElementById("score").textContent = "Score: " + score;
}

function addTime(seconds) {
  timeLeft += seconds;
  document.getElementById("time").textContent = timeLeft;
}

function loadGame(gameName) {
  const gameArea = document.getElementById("game-area");
  gameArea.innerHTML = `<iframe src="${gameName}/index.html" width="100%" height="300" frameborder="0"></iframe>`;
}

function nextGame() {
  currentGameIndex++;
  if (currentGameIndex < games.length) {
    loadGame(games[currentGameIndex]);
  } else {
    endChallenge();
  }
}

function endChallenge() {
  document.getElementById("game-area").innerHTML = "";
  document.getElementById("game-over").style.display = "block";
  document.getElementById("final-score").textContent = "Final Score: " + score;
}

function restartChallenge() {
  timeLeft = 60;
  score = 0;
  currentGameIndex = 0;
  document.getElementById("score").textContent = "Score: 0";
  document.getElementById("time").textContent = timeLeft;
  document.getElementById("game-over").style.display = "none";
  document.getElementById("start-btn").style.display = "inline-block";
}

function goBack() {
  window.location.href = "../index.html";
}

document.getElementById("start-btn").addEventListener("click", startChallenge);