const canvas = document.getElementById("breakoutCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const gameOverOverlay = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");

let paddleHeight = 10, paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false, leftPressed = false;

let ballRadius = 8;
let balls = []; // multiple balls supported

let brickRowCount = 5, brickColumnCount = 7;
let brickWidth = 55, brickHeight = 20, brickPadding = 10, brickOffsetTop = 30, brickOffsetLeft = 30;
let bricks = [];

let score = 0;
let lives = 3;
let highScore = localStorage.getItem("highScoreBreakout") ? parseInt(localStorage.getItem("highScoreBreakout")) : 0;
let gameInterval;

// Brick colors (authentic earthy palette)
const BRICK_COLORS = ["#B22222", "#CD5C5C", "#8B0000", "#A0522D", "#D2691E", "#808080"];

// Power‑ups
let powerUps = [];
let paddleGlow = false;

function init() {
  score = 0;
  lives = 3;
  paddleX = (canvas.width - paddleWidth) / 2;
  balls = [{x: canvas.width/2, y: canvas.height-30, dx: 3, dy: -3}];

  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }

  powerUps = [];
  paddleGlow = false;

  gameOverOverlay.style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  clearInterval(gameInterval);
  gameInterval = setInterval(draw, 20);
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        ctx.fillStyle = BRICK_COLORS[r % BRICK_COLORS.length];
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}

function drawBalls() {
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
  });
}

function drawPaddle() {
  ctx.fillStyle = paddleGlow ? "#00ff00" : "#4CAF50";
  ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function drawScore() {
  scoreDisplay.textContent = "Score: " + score;
  highScoreDisplay.textContent = "High Score: " + highScore;
}

function drawLives() {
  ctx.font = "16px Segoe UI";
  ctx.fillStyle = "#fff";
  ctx.fillText("Lives: " + lives, canvas.width - 80, 20);
}

function collisionDetection() {
  balls.forEach(ball => {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        let b = bricks[c][r];
        if (b.status == 1) {
          if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
            ball.dy = -ball.dy;
            b.status = 0;
            score++;

            // Random chance to spawn a power‑up
            if (Math.random() < 0.15) {
              let types = ["expand","shrink","multiball"];
              let type = types[Math.floor(Math.random()*types.length)];
              powerUps.push({ x: b.x + brickWidth/2, y: b.y, type });
            }

            // Infinite waves: reset bricks when all cleared
            if (score == brickRowCount * brickColumnCount) {
              for (let c2 = 0; c2 < brickColumnCount; c2++) {
                for (let r2 = 0; r2 < brickRowCount; r2++) {
                  bricks[c2][r2].status = 1;
                }
              }
              score = 0;
              balls.forEach(ball => { ball.dx *= 1.2; ball.dy *= 1.2; });
            }
          }
        }
      }
    }
  });
}

function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === "expand" ? "#00f" : (p.type === "shrink" ? "#f00" : "#ff0");
    ctx.fillRect(p.x, p.y, 15, 15);
    p.y += 2; // fall down

    // Paddle catches power‑up
    if (p.y > canvas.height - paddleHeight &&
        p.x > paddleX && p.x < paddleX + paddleWidth) {
      if (p.type === "expand") {
        paddleWidth += 20;
        paddleGlow = true;
        setTimeout(()=>{ paddleWidth -= 20; paddleGlow = false; }, 5000);
      } else if (p.type === "shrink") {
        paddleWidth = Math.max(40, paddleWidth - 20);
      } else if (p.type === "multiball") {
        balls.push({x: canvas.width/2, y: canvas.height-30, dx: -3, dy: -3});
      }
      p.caught = true;
    }
  });
  powerUps = powerUps.filter(p => !p.caught && p.y < canvas.height);
}

function updateBalls() {
  balls.forEach(ball => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ballRadius > canvas.width || ball.x - ballRadius < 0) ball.dx = -ball.dx;
    if (ball.y - ballRadius < 0) ball.dy = -ball.dy;
    else if (ball.y + ballRadius > canvas.height) {
      if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
        ball.dy = -ball.dy;
      } else {
        lives--;
        balls.splice(balls.indexOf(ball),1);
        if (lives > 0 && balls.length === 0) {
          balls.push({x: canvas.width/2, y: canvas.height-30, dx: 3, dy: -3});
        } else if (lives <= 0) {
          clearInterval(gameInterval);
          gameOver();
        }
      }
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBalls();
  drawPaddle();
  drawScore();
  drawLives();
  drawPowerUps();
  collisionDetection();
  updateBalls();

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
  else if (leftPressed && paddleX > 0) paddleX -= 7;
}

function gameOver() {
  gameOverOverlay.style.display = "block";
  finalScoreDisplay.textContent = "Final Score: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScoreBreakout", highScore);
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
  let leaderboard = JSON.parse(localStorage.getItem("leaderboardBreakout")) || [];
  leaderboard.push({ name: nickname, score: score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // top 5
  localStorage.setItem("leaderboardBreakout", JSON.stringify(leaderboard));
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
  if (e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "ArrowLeft") leftPressed = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "ArrowLeft") leftPressed = false;
});

// Start game
init();