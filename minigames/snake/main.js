const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const gameOverOverlay = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");

let box = 20;
let snake;
let direction;
let food;
let score;
let highScore = localStorage.getItem("highScoreSnake") ? parseInt(localStorage.getItem("highScoreSnake")) : 0;
let game;

function init() {
  snake = [{x: 9*box, y: 10*box}];
  direction = null;
  score = 0;
  food = {
    x: Math.floor(Math.random()*20)*box,
    y: Math.floor(Math.random()*20)*box
  };
  gameOverOverlay.style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  clearInterval(game);
  game = setInterval(draw, 100);
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = (i === 0) ? "#4CAF50" : "#76ff03";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
    ctx.strokeStyle = "#111";
    ctx.strokeRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = "#f44336";
  ctx.fillRect(food.x, food.y, box, box);

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  if (snakeX === food.x && snakeY === food.y) {
    score++;
    food = {
      x: Math.floor(Math.random()*20)*box,
      y: Math.floor(Math.random()*20)*box
    };
  } else {
    snake.pop();
  }

  let newHead = {x: snakeX, y: snakeY};

  if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
    clearInterval(game);
    gameOver();
    return;
  }

  snake.unshift(newHead);

  scoreDisplay.textContent = "Score: " + score;
  highScoreDisplay.textContent = "High Score: " + highScore;
}

function collision(head, array) {
  for (let i = 0; i < array.length; i++) {
    if (head.x === array[i].x && head.y === array[i].y) return true;
  }
  return false;
}

function gameOver() {
  gameOverOverlay.style.display = "block";
  finalScoreDisplay.textContent = "Final Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScoreSnake", highScore);
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
  let leaderboard = JSON.parse(localStorage.getItem("leaderboardSnake")) || [];
  leaderboard.push({name: nickname, score: score});
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // top 5
  localStorage.setItem("leaderboardSnake", JSON.stringify(leaderboard));
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
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

// Start game
init();