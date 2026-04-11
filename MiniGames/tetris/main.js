const canvas = document.getElementById("tetrisCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const gameOverOverlay = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20;

// ✅ Fix canvas size to match board exactly
canvas.width = COLS * BLOCK_SIZE;   // 200px
canvas.height = ROWS * BLOCK_SIZE;  // 400px

let board = [];
let score = 0;
let highScore = localStorage.getItem("highScoreTetris") ? parseInt(localStorage.getItem("highScoreTetris")) : 0;
let currentPiece;
let gameInterval;

// Tetromino shapes
const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};

const COLORS = {
  I: "#00f0f0", O: "#f0f000", T: "#a000f0",
  S: "#00f000", Z: "#f00000", J: "#0000f0", L: "#f0a000"
};

function init() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0;
  spawnPiece();
  gameOverOverlay.style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  clearInterval(gameInterval);
  // ✅ Faster speed (300ms per step)
  gameInterval = setInterval(update, 300);
  drawBoard();
}

function spawnPiece() {
  const keys = Object.keys(SHAPES);
  const type = keys[Math.floor(Math.random()*keys.length)];
  currentPiece = {
    shape: SHAPES[type],
    color: COLORS[type],
    x: Math.floor(COLS/2)-1,
    y: 0
  };
}

function drawBoard() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      if (board[r][c]) {
        ctx.fillStyle = board[r][c];
        ctx.fillRect(c*BLOCK_SIZE,r*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(c*BLOCK_SIZE,r*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
      }
    }
  }

  drawPiece();
  scoreDisplay.textContent = "Score: " + score;
  highScoreDisplay.textContent = "High Score: " + highScore;
}

function drawPiece() {
  currentPiece.shape.forEach((row,y) => {
    row.forEach((val,x) => {
      if (val) {
        ctx.fillStyle = currentPiece.color;
        ctx.fillRect((currentPiece.x+x)*BLOCK_SIZE,(currentPiece.y+y)*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
        ctx.strokeStyle = "#000";
        ctx.strokeRect((currentPiece.x+x)*BLOCK_SIZE,(currentPiece.y+y)*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
      }
    });
  });
}

function movePiece(dx,dy) {
  currentPiece.x += dx;
  currentPiece.y += dy;
  if (collision()) {
    currentPiece.x -= dx;
    currentPiece.y -= dy;
    return false;
  }
  return true;
}

function rotatePiece() {
  const shape = currentPiece.shape;
  const newShape = shape[0].map((_,i)=>shape.map(row=>row[i]).reverse());
  const oldShape = currentPiece.shape;
  currentPiece.shape = newShape;
  if (collision()) currentPiece.shape = oldShape;
}

function collision() {
  for (let y=0;y<currentPiece.shape.length;y++) {
    for (let x=0;x<currentPiece.shape[y].length;x++) {
      if (currentPiece.shape[y][x]) {
        let newX = currentPiece.x+x;
        let newY = currentPiece.y+y;
        if (newX<0||newX>=COLS||newY>=ROWS||board[newY][newX]) return true;
      }
    }
  }
  return false;
}

function mergePiece() {
  currentPiece.shape.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if (val) {
        board[currentPiece.y+y][currentPiece.x+x] = currentPiece.color;
      }
    });
  });
}

function clearLines() {
  for (let r=ROWS-1;r>=0;r--) {
    if (board[r].every(cell=>cell)) {
      board.splice(r,1);
      board.unshift(Array(COLS).fill(0));
      score += 10;
    }
  }
}

function update() {
  if (!movePiece(0,1)) {
    mergePiece();
    clearLines();
    spawnPiece();
    if (collision()) {
      clearInterval(gameInterval);
      gameOver();
      return;
    }
  }
  drawBoard();
}

function gameOver() {
  gameOverOverlay.style.display = "block";
  finalScoreDisplay.textContent = "Final Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScoreTetris", highScore);
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
  let leaderboard = JSON.parse(localStorage.getItem("leaderboardTetris")) || [];
  leaderboard.push({name: nickname, score: score});
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // top 5
  localStorage.setItem("leaderboardTetris", JSON.stringify(leaderboard));
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
  if (e.key === "ArrowLeft") movePiece(-1,0);
  else if (e.key === "ArrowRight") movePiece(1,0);
  else if (e.key === "ArrowDown") movePiece(0,1);
  else if (e.key === "ArrowUp") rotatePiece();
});

// Start game
init();