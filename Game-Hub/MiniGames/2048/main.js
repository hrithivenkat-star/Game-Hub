const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const gameOverOverlay = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");

let score = 0;
let highScore = localStorage.getItem("highScore2048") ? parseInt(localStorage.getItem("highScore2048")) : 0;
let grid = [];

function init() {
  grid = Array(4).fill().map(() => Array(4).fill(0));
  score = 0;
  addTile();
  addTile();
  drawBoard();
  gameOverOverlay.style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
}

function addTile() {
  let empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push({r, c});
    }
  }
  if (empty.length) {
    let {r, c} = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function drawBoard() {
  document.querySelectorAll(".tile").forEach(tile => tile.remove());

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== 0) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.textContent = grid[r][c];
        tile.style.background = getColor(grid[r][c]);
        tile.style.left = (c * 110 + 10) + "px";
        tile.style.top = (r * 110 + 10) + "px";
        board.appendChild(tile);
      }
    }
  }
  scoreDisplay.textContent = "Score: " + score;
  highScoreDisplay.textContent = "High Score: " + highScore;
}

function getColor(value) {
  const colors = {
    2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563",
    32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61",
    512: "#edc850", 1024: "#edc53f", 2048: "#edc22e"
  };
  return colors[value] || "#3c3a32";
}

function slide(row) {
  row = row.filter(val => val);
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] === row[i+1]) {
      row[i] *= 2;
      score += row[i];
      row[i+1] = 0;
    }
  }
  row = row.filter(val => val);
  while (row.length < 4) row.push(0);
  return row;
}

function rotateGrid(times) {
  for (let t = 0; t < times; t++) {
    grid = grid.map((_, i) => grid.map(row => row[i]).reverse());
  }
}

function move(direction) {
  let oldGrid = JSON.stringify(grid);
  if (direction === "left") {
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r]);
  } else if (direction === "right") {
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r].reverse()).reverse();
  } else if (direction === "up") {
    rotateGrid(1);
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r]);
    rotateGrid(3);
  } else if (direction === "down") {
    rotateGrid(1);
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r].reverse()).reverse();
    rotateGrid(3);
  }
  if (JSON.stringify(grid) !== oldGrid) {
    addTile();
    drawBoard();
    checkGameOver();
  }
}

function checkGameOver() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return;
      if (c < 3 && grid[r][c] === grid[r][c+1]) return;
      if (r < 3 && grid[r][c] === grid[r+1][c]) return;
    }
  }
  gameOverOverlay.style.display = "block";
  finalScoreDisplay.textContent = "Final Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore2048", highScore);
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
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard2048")) || [];
  leaderboard.push({name: nickname, score: score});
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // top 5
  localStorage.setItem("leaderboard2048", JSON.stringify(leaderboard));
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
  if (e.key === "ArrowLeft") move("left");
  else if (e.key === "ArrowRight") move("right");
  else if (e.key === "ArrowUp") move("up");
  else if (e.key === "ArrowDown") move("down");
});

// Start game
init();