const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let score = 0;
let best = localStorage.getItem("flappyBest") || 0;
bestEl.textContent = best;

let bird, gravity, velocity, pipes, gameRunning, frame;

// Neon colors
const colors = {
  bird: "#ffeb3b",
  pipe: "#00ff9d",
  bg: "#0a0a1f",
  ground: "#1a1a3f"
};

function resetGame() {
  bird = { x: 80, y: 250, radius: 14, velocity: 0 };
  gravity = 0.6;
  velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  gameRunning = false;
  scoreEl.textContent = "0";

  // First pipe
  pipes.push({ x: 350, top: 180, passed: false });
}

function drawBackground() {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Neon grid effect
  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(Math.min(Math.max(bird.velocity * 0.05, -0.5), 1.2));

  // Neon glow
  ctx.shadowBlur = 30;
  ctx.shadowColor = colors.bird;

  ctx.fillStyle = colors.bird;
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(6, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPipes() {
  ctx.shadowBlur = 20;
  ctx.shadowColor = colors.pipe;

  for (let pipe of pipes) {
    // Top pipe
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(pipe.x, 0, 60, pipe.top);
    ctx.fillRect(pipe.x - 5, pipe.top - 30, 70, 30); // cap

    // Bottom pipe
    const bottomY = pipe.top + 180;
    ctx.fillRect(pipe.x, bottomY, 60, canvas.height - bottomY);
    ctx.fillRect(pipe.x - 5, bottomY, 70, 30); // cap
  }
  ctx.shadowBlur = 0;
}

function update() {
  if (!gameRunning) return;

  bird.velocity += gravity;
  bird.y += bird.velocity;

  frame++;

  // Spawn pipes
  if (frame % 90 === 0) {
    const top = Math.random() * 220 + 80;
    pipes.push({ x: canvas.width + 60, top: top, passed: false });
  }

  // Move pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= 2.5;

    // Score
    if (!pipes[i].passed && pipes[i].x + 60 < bird.x) {
      pipes[i].passed = true;
      score++;
      scoreEl.textContent = score;
    }

    // Remove off-screen pipes
    if (pipes[i].x < -70) pipes.splice(i, 1);
  }

  // Collision
  if (bird.y - bird.radius < 0 || bird.y + bird.radius > canvas.height - 40) {
    endGame();
  }

  for (let pipe of pipes) {
    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + 60 &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.top + 180)
    ) {
      endGame();
    }
  }
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();

  // Ground glow
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function flap() {
  if (!gameRunning) return;
  bird.velocity = -12;
}

function startGame() {
  resetGame();
  gameRunning = true;
  startBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
}

function endGame() {
  gameRunning = false;
  if (score > best) {
    best = score;
    localStorage.setItem("flappyBest", best);
    bestEl.textContent = best;
  }
  restartBtn.classList.remove("hidden");
}

// Event Listeners
canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!gameRunning && startBtn.classList.contains("hidden")) {
      startGame();
    } else {
      flap();
    }
  }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// Start the loop
resetGame();
gameLoop();