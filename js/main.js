function saveNickname() {
  const name = document.getElementById("nickname").value.trim();
  if (name) {
    localStorage.setItem("nickname", name);
    document.getElementById("nickname-prompt").style.display = "none";
    document.getElementById("game-modes").style.display = "block";
  }
}

function openMode(mode) {
  if (mode === 'minigames') {
    window.location.href = "minigames/index.html";
  } else if (mode === 'multiplayer') {
    window.location.href = "multiplayer/index.html";
  } else if (mode === 'timed') {
    window.location.href = "timed/index.html";
  }
}