<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Breakout — Game Hub</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --neon-cyan: #00f5ff;
    --neon-purple: #bf00ff;
    --neon-pink: #ff006e;
    --neon-green: #00ff88;
    --neon-yellow: #ffe600;
    --neon-orange: #ff6b00;
    --neon-red: #ff003c;
    --bg-dark: #050510;
  }

  html, body {
    min-height: 100vh;
    background: var(--bg-dark);
    color: #e0e8ff;
    font-family: 'Rajdhani', sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: linear-gradient(rgba(0,245,255,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,245,255,0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
  .scanline {
    position: fixed; left: 0; right: 0; height: 2px;
    background: linear-gradient(transparent, rgba(0,245,255,0.03), transparent);
    animation: scanline 9s linear infinite;
    pointer-events: none; z-index: 0;
  }

  nav {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid rgba(0,245,255,0.08);
    background: rgba(5,5,16,0.95);
  }
  .logo { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 900; color: var(--neon-cyan); text-decoration: none; text-shadow: 0 0 15px rgba(0,245,255,0.5); }
  .logo span { color: var(--neon-purple); }

  .pause-btn {
    font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    padding: 7px 16px; border-radius: 6px; cursor: pointer;
    border: 1px solid rgba(255,230,0,0.3);
    background: rgba(255,230,0,0.08); color: var(--neon-yellow);
  }
  .pause-btn:hover { background: rgba(255,230,0,0.18); box-shadow: 0 0 12px rgba(255,230,0,0.2); }

  .game-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; padding: 14px; gap: 18px; }
  .side-panel { display: flex; flex-direction: column; gap: 10px; width: 145px; flex-shrink: 0; }

  .panel-card {
    background: #0a0a1a; border: 1px solid rgba(0,245,255,0.1);
    border-radius: 10px; padding: 12px; text-align: center;
  }
  .panel-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6677aa; margin-bottom: 5px; }
  .panel-value { font-family: 'Orbitron', monospace; font-size: 22px; font-weight: 700; color: var(--neon-cyan); text-shadow: 0 0 12px rgba(0,245,255,0.5); }

  .lives-row { display: flex; gap: 5px; justify-content: center; margin-top: 4px; }
  .heart { font-size: 18px; filter: drop-shadow(0 0 5px rgba(255,0,60,0.7)); }
  .heart.lost { opacity: 0.2; }

  canvas { display: block; border-radius: 8px; background: #020208; border: 1px solid rgba(0,245,255,0.08); }
  canvas.shake { animation: shake 0.35s ease; }

  .overlay {
    position: absolute; inset: 0; border-radius: 8px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(2,2,8,0.93); z-index: 10; padding: 20px;
  }
  .overlay.hidden { display: none; }
  .overlay-icon { font-size: 46px; margin-bottom: 10px; }
  .overlay-title { font-family: 'Orbitron', monospace; font-size: 26px; font-weight: 900; margin-bottom: 7px; letter-spacing: 2px; }
  .overlay-sub { font-size: 13px; color: #6677aa; margin-bottom: 22px; text-align: center; line-height: 1.6; }

  .btn {
    font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    padding: 11px 20px; border-radius: 7px; cursor: pointer;
  }
  .btn-pink { background: rgba(255,0,110,0.12); color: var(--neon-pink); border: 1px solid rgba(255,0,110,0.3); }
  .btn-cyan { background: rgba(0,245,255,0.12); color: var(--neon-cyan); border: 1px solid rgba(0,245,255,0.3); }
</style>
</head>
<body>
<div class="scanline"></div>

<nav>
  <a href="../../index.html" class="logo">GAME<span>HUB</span></a>
  <div class="nav-right">
    <button class="pause-btn" id="pause-btn" onclick="togglePause()">⏸ Pause</button>
    <a href="../index.html" class="back-btn">← Mini Games</a>
  </div>
</nav>

<div class="game-wrapper">
  <!-- Left Panel -->
  <div class="side-panel">
    <div class="panel-card"><div class="panel-label">SCORE</div><div class="panel-value" id="score-display">0</div></div>
    <div class="panel-card" style="border-color:rgba(255,230,0,0.15)"><div class="panel-label">BEST</div><div class="panel-value" id="best-display" style="color:var(--neon-yellow)">0</div></div>
    <div class="panel-card" style="border-color:rgba(191,0,255,0.15)"><div class="panel-label">LEVEL</div><div class="panel-value" id="level-display" style="color:var(--neon-purple)">1</div></div>
    <div class="panel-card" style="border-color:rgba(255,0,60,0.15)"><div class="panel-label">LIVES</div><div class="lives-row" id="lives-display"></div></div>
    <div class="panel-card" style="border-color:rgba(255,0,110,0.1)"><div class="panel-label">BRICKS</div><div class="panel-value" id="bricks-display" style="color:var(--neon-pink)">0</div><div class="progress-bar"><div class="progress-fill" id="brick-progress" style="width:100%"></div></div></div>
  </div>

  <!-- Canvas -->
  <div class="canvas-wrap">
    <canvas id="gameCanvas" width="500" height="560"></canvas>

    <div class="overlay" id="start-screen">
      <div class="overlay-icon">🧱</div>
      <div class="overlay-title" style="color:var(--neon-pink)">BREAKOUT</div>
      <div class="overlay-sub">3 Normal Levels +<br><strong>Infinite Mode</strong><br>Power-ups enabled!</div>
      <button class="btn btn-pink" onclick="startGame()">START GAME</button>
    </div>
  </div>

  <!-- Right Panel -->
  <div class="side-panel">
    <div class="panel-card" style="border-color:rgba(0,255,136,0.1)"><div class="panel-label">COMBO</div><div class="panel-value" id="combo-display" style="color:var(--neon-green)">x1</div></div>
    <div class="panel-card" style="border-color:rgba(255,107,0,0.1)"><div class="panel-label">SPEED</div><div id="speed-dots" style="display:flex;gap:3px;justify-content:center;margin-top:8px"></div></div>
  </div>
</div>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 500, H = 560;

const PADDLE_W = 96, PADDLE_H = 13, PADDLE_Y = H - 36;
const BALL_R = 8;
const BRICK_ROWS = 6, BRICK_COLS = 10;
const BRICK_W = 43, BRICK_H = 16, BRICK_GAP = 4;
const BRICK_OFFSET_X = (W - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
const BRICK_OFFSET_Y = 50;

let paddle, balls = [], bricks = [], particles = [], powerups = [], scorePopups = [];
let score = 0, bestScore = parseInt(localStorage.getItem('breakout_best') || '0'), lives = 3, level = 1, combo = 0;
let gameRunning = false, paused = false, isInfinite = false;
let totalBricks = 0, bricksLeft = 0;
let paddleWidth = PADDLE_W;
let paddleExpandTimer = 0;
let descendTimer = 0;   // for infinite mode

document.getElementById('best-display').textContent = bestScore;

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ' && gameRunning && !paused) launchBall();
  if (e.key.toLowerCase() === 'p') togglePause();
});
document.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('click', () => { if (gameRunning && !paused) launchBall(); });

function createBricks(lvl, isInf = false) {
  const arr = [];
  const rowsToSpawn = isInf ? 1 : BRICK_ROWS;   // only 1 new row in infinite

  for (let r = 0; r < rowsToSpawn; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!isInf && lvl === 2 && (r + c) % 3 === 0) continue;
      if (!isInf && lvl === 3 && (r * c) % 4 === 0) continue;

      // In infinite mode, sometimes make denser rows
      if (isInf && Math.random() < 0.15) continue;

      arr.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_GAP),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_GAP) - (isInf ? 300 : 0), // start higher when spawning new
        w: BRICK_W, h: BRICK_H,
        color: ['#ff006e', '#ff6b00', '#00f5ff', '#00ff88'][Math.floor(Math.random()*4)],
        points: (20 + Math.floor(level/2) * 10),
        alive: true
      });
    }
  }
  return arr;
}

function initRound() {
  paddle = { x: W/2 - paddleWidth/2, y: PADDLE_Y, w: paddleWidth, h: PADDLE_H };
  balls = [{
    x: W/2, y: PADDLE_Y - BALL_R - 2,
    dx: 0, dy: 0,
    speed: 5.5 + (level-1)*0.7,
    trail: []
  }];
  particles = []; powerups = []; scorePopups = [];
  combo = 0;
  ballLaunched = false;
}

let ballLaunched = false;

function startGame() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
  score = 0; lives = 3; level = 1; isInfinite = false; paddleWidth = PADDLE_W;
  bricks = createBricks(level);
  totalBricks = bricks.length; bricksLeft = totalBricks;
  initRound();
  updateUI();
  gameRunning = true;
  paused = false;
}

function nextLevel() {
  if (level >= 3) {
    // Enter Infinite Mode
    isInfinite = true;
    level = 4; // just for display
    document.getElementById('level-display').style.color = '#ffe600';
    document.getElementById('level-display').textContent = '∞';
  } else {
    level++;
  }

  // Add new bricks (in infinite: add one row at top)
  const newBricks = createBricks(level, isInfinite);
  bricks = bricks.concat(newBricks);
  totalBricks += newBricks.length;
  bricksLeft += newBricks.length;

  initRound();
  updateUI();
  gameRunning = true;
}

function launchBall() {
  if (ballLaunched || balls.length === 0) return;
  ballLaunched = true;
  const b = balls[0];
  const angle = -Math.PI/2 + (Math.random()*0.7 - 0.35);
  b.dx = Math.cos(angle) * b.speed;
  b.dy = Math.sin(angle) * b.speed;
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
}

function update() {
  if (!gameRunning || paused || !paddle) return;

  // Paddle movement
  if (keys['ArrowLeft'] || keys['a']) paddle.x = Math.max(0, paddle.x - 8);
  if (keys['ArrowRight'] || keys['d']) paddle.x = Math.min(W - paddle.w, paddle.x + 8);
  paddle.w = paddleWidth;

  // Update balls
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    if (!ballLaunched) {
      b.x = paddle.x + paddle.w / 2;
      continue;
    }

    b.trail.push({x: b.x, y: b.y});
    if (b.trail.length > 12) b.trail.shift();

    b.x += b.dx;
    b.y += b.dy;

    if (b.x - BALL_R <= 0 || b.x + BALL_R >= W) b.dx *= -1;
    if (b.y - BALL_R <= 0) b.dy *= -1;

    if (b.y > H + 50) {
      balls.splice(i, 1);
      if (balls.length === 0) ballLost();
      continue;
    }

    // Paddle hit
    if (b.dy > 0 && b.y + BALL_R >= paddle.y && b.y - BALL_R <= paddle.y + paddle.h &&
        b.x >= paddle.x && b.x <= paddle.x + paddle.w) {
      b.dy = -Math.abs(b.dy) * 1.02;
      const hit = (b.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
      b.dx = hit * 7.5;
    }

    // Brick collision
    for (let j = 0; j < bricks.length; j++) {
      const br = bricks[j];
      if (!br.alive) continue;

      if (b.x + BALL_R > br.x && b.x - BALL_R < br.x + br.w &&
          b.y + BALL_R > br.y && b.y - BALL_R < br.y + br.h) {

        br.alive = false;
        bricksLeft--;
        combo++;
        const pts = br.points * Math.max(1, Math.floor(combo / 3));
        score += pts;

        spawnParticles(br.x + br.w/2, br.y + br.h/2, br.color);
        spawnScorePopup(br.x + br.w/2, br.y, '+' + pts);

        if (Math.random() < 0.28) {
          powerups.push({ x: br.x + br.w/2, y: br.y + br.h/2, type: ['life','expand','speed','multiball'][Math.floor(Math.random()*4)], vy: 2.8 });
        }

        b.dy *= -1;
        updateUI();

        if (bricksLeft <= 0) {
          gameRunning = false;
          setTimeout(nextLevel, 400);
          return;
        }
        break;
      }
    }
  }

  // Power-ups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += p.vy;
    if (p.y > H) { powerups.splice(i, 1); continue; }

    if (p.y + 12 >= paddle.y && p.y - 12 <= paddle.y + paddle.h &&
        p.x >= paddle.x && p.x <= paddle.x + paddle.w) {
      activatePowerUp(p.type);
      powerups.splice(i, 1);
    }
  }

  if (paddleExpandTimer > 0) {
    paddleExpandTimer--;
    if (paddleExpandTimer === 0) paddleWidth = PADDLE_W;
  }

  // Infinite mode: slowly descend bricks
  if (isInfinite) {
    descendTimer++;
    if (descendTimer > 90) {  // every ~1.5 seconds
      descendTimer = 0;
      bricks.forEach(br => {
        if (br.alive) br.y += BRICK_H + BRICK_GAP + 2;
      });

      // If any brick reaches paddle height → game over (extra challenge)
      for (const br of bricks) {
        if (br.alive && br.y + br.h > paddle.y - 20) {
          ballLost();
          return;
        }
      }
    }
  }

  // Particles & popups
  particles = particles.filter(p => (p.life -= 0.04) > 0);
  scorePopups = scorePopups.filter(s => (s.life -= 0.03) > 0);
}

function activatePowerUp(type) {
  if (type === 'life') lives = Math.min(6, lives + 1);
  else if (type === 'expand') { paddleWidth = PADDLE_W * 1.65; paddleExpandTimer = 650; }
  else if (type === 'speed') balls.forEach(b => b.speed = Math.min(18, b.speed + 2.5));
  else if (type === 'multiball' && balls.length < 4) {
    const main = balls[0];
    balls.push({x:main.x, y:main.y, dx:main.dx*0.85, dy:main.dy*-1.05, speed:main.speed, trail:[]});
    balls.push({x:main.x, y:main.y, dx:main.dx*-0.85, dy:main.dy*-1.05, speed:main.speed, trail:[]});
  }
  updateLives();
  spawnParticles(paddle.x + paddle.w/2, paddle.y - 10, '#00ff88', 25);
}

function ballLost() {
  gameRunning = false;
  lives--;
  updateLives();
  if (lives <= 0) {
    // Save high score
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('breakout_best', bestScore);
      document.getElementById('best-display').textContent = bestScore;
    }
    setTimeout(showGameOver, 600);
  } else {
    setTimeout(() => document.getElementById('lost-screen').classList.remove('hidden'), 400);
  }
}

function showGameOver() {
  document.getElementById('gameover-screen').classList.remove('hidden'); // you can expand this overlay if needed
}

function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({ x, y, vx: Math.cos(a)* (2 + Math.random()*3), vy: Math.sin(a)* (2 + Math.random()*3) - 2, life: 1, color });
  }
}

function spawnScorePopup(x, y, text) {
  scorePopups.push({ x, y, text, life: 1.3 });
}

function updateUI() {
  document.getElementById('score-display').textContent = score;
  document.getElementById('bricks-display').textContent = bricksLeft;
  document.getElementById('combo-display').textContent = `x${Math.max(1, combo)}`;
  document.getElementById('brick-progress').style.width = totalBricks ? (bricksLeft / totalBricks * 100) + '%' : '0%';
  updateLives();
}

function updateLives() {
  const el = document.getElementById('lives-display');
  el.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const h = document.createElement('span');
    h.className = 'heart' + (i >= lives ? ' lost' : '');
    h.textContent = '❤️';
    el.appendChild(h);
  }
}

function draw() {
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, W, H);

  if (!paddle) return;

  // Bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.shadowBlur = 12;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  ctx.shadowBlur = 0;

  // Balls
  for (const b of balls) {
    for (let i = 0; i < b.trail.length; i++) {
      ctx.globalAlpha = (i / b.trail.length) * 0.55;
      ctx.fillStyle = '#00f5ff';
      ctx.beginPath();
      ctx.arc(b.trail[i].x, b.trail[i].y, BALL_R * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 24;
    ctx.shadowColor = '#00f5ff';
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Paddle
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00f5ff';
  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.shadowBlur = 0;

  // Power-ups
  for (const p of powerups) {
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    const emoji = p.type === 'life' ? '❤️' : p.type === 'expand' ? '📏' : p.type === 'speed' ? '⚡' : '🔥';
    ctx.fillText(emoji, p.x, p.y + 8);
  }

  // Particles (simple)
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
  }
  ctx.globalAlpha = 1;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Init
updateLives();
gameLoop();
</script>
</body>
</html>
