import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArIpjo9Rye5S7IQRXu1std4srOcAD7I_Y",
  authDomain: "gamehub234.firebaseapp.com",
  databaseURL: "https://gamehub234-default-rtdb.firebaseio.com",
  projectId: "gamehub234",
  storageBucket: "gamehub234.firebasestorage.app",
  messagingSenderId: "902315908438",
  appId: "1:902315908438:web:7ff2c34487b24c71998af7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function submitScore(game, player, score) {
  return push(ref(db, `scores/${game}`), {
    player: player || "Anonymous",
    score: score,
    ts: Date.now()
  });
}

export function watchLeaderboard(game, callback, limit = 10) {
  const q = query(ref(db, `scores/${game}`), orderByChild("score"), limitToLast(limit));
  onValue(q, (snap) => {
    const rows = [];
    snap.forEach(child => rows.unshift(child.val()));
    callback(rows);
  });
}

export function getPlayer() {
  return localStorage.getItem("gamehub_nickname") || "Player";
}
