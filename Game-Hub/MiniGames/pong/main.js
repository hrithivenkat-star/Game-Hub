const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const gameOverOverlay = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");

let paddleHeight = 80, paddleWidth = 10;
let playerY = canvas.height/2 - paddleHeight/2;
let aiY = canvas.height/2 - paddleHeight/2;
let ballX, ballY, ballRadius = 8;
let ballSpeedX, ballSpeedY;
let score = 0;
let highScore = localStorage.getItem("highScorePong") ? parseInt(localStorage.getItem("highScorePong")) : 0;
let gameInterval;

function init() {
  score = 0;
  ballX = canvas.width/2;
  ballY = canvas.height/2;
  ballSpeedX = 4;
  ballSpeedY = 3;
  gameOverOverlay.style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  clearInterval(gameInterval);
  gameInterval = setInterval(update, 20); // fast refresh
}

function drawBoard() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Player paddle
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, playerY, paddleWidth, paddleHeight);

  // AI paddle
  ctx.fillStyle = "#f44336";
  ctx.fillRect(canvas.width-paddleWidth, aiY, paddleWidth, paddleHeight);

  // Ball
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI*2);
  ctx.fill();

  scoreDisplay.textContent = "Score: " + score;
  highScoreDisplay.textContent = "High Score: " + highScore;
}

function update() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Bounce top/bottom
  if (ballY-ballRadius<0 || ballY+ballRadius>canvas.height) ballSpeedY = -ballSpeedY;

  // AI paddle follows ball
  aiY += (ballY - (aiY+paddleHeight/2)) * 0.1;

  // Collision with player paddle
  if (ballX-ballRadius<0+paddleWidth && ballY>playerY && ballY<playerY+paddleHeight) {
    ballSpeedX = -ballSpeedX;
    score++;
  }

  // Collision with AI paddle
  if (ballX+ballRadius>canvas.width-paddleWidth && ballY>aiY && ballY<aiY+paddleHeight) {
    ballSpeedX = -ballSpeedX;
  }

  // Game Over
  if (ballX-ballRadius<0) {
    clearInterval(gameInterval);
    gameOver();
    return;
  }

  drawBoard();
}

function gameOver() {
  gameOverOverlay.style.display = "block";
  finalScoreDisplay.textContent = "Final Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScorePong", highScore);
  }
  saveLeaderboard();
  document.getElementById("leaderboard").style.display = "block";
}

function restartGame() {
  init();
}

function goBack() {
  window.location.href = "../index.html";
}

// Leaderboard functions
function saveLeaderboard() {
  let nickname = localStorage.getItem("nickname") || "Player";
  let leaderboard = JSON.parse(localStorage.getItem("leaderboardPong")) || [];
  leaderboard.push({name: nickname, score: score});
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // top 5
  localStorage.setItem("leaderboardPong", JSON.stringify(leaderboard));
  displayLeaderboard(leaderboard);
}

function displayLeaderboard(leaderboard) {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  leaderboard.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(li);
  });
}

// Controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && playerY>0) playerY -= 20;
  else if (e.key === "ArrowDown" && playerY<canvas.height-paddleHeight) playerY += 20;
});

// Start game
init();