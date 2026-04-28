/**
 * GameHub Sound System
 * Procedural audio via Web Audio API — zero external files needed.
 *
 * Usage: <script src="/shared/sounds.js"></script>
 * Then:  GH.sound('win') / GH.sound('lose') / GH.sound('click')
 *
 * Available sounds: click, jump, land, hit, coin, win, lose, shoot,
 *                   whoosh, bounce, beep, error, level, powerup
 */
window.GH = window.GH || {};

(function(GH) {

  let ctx = null;
  let muted = localStorage.getItem('gh_muted') === '1';

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  // Resume context after user interaction (browser policy)
  document.addEventListener('click', function resume() {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
    document.removeEventListener('click', resume);
  }, { once: false });

  // ─── CORE SYNTHESISER ──────────────────────────────────────────
  // Each sound is defined as a tiny recipe: wave type, frequency envelope,
  // gain envelope, and optional filter. Plays and discards itself.

  function play(recipe) {
    if (muted) return;
    const c = getCtx();
    if (!c) return;

    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = recipe.wave || 'square';

    // Frequency envelope
    const freq = recipe.freq || [440];
    osc.frequency.setValueAtTime(freq[0], now);
    if (freq[1] !== undefined) {
      const freqTime = recipe.freqTime || (recipe.dur || 0.15) * 0.5;
      osc.frequency.linearRampToValueAtTime(freq[1], now + freqTime);
      if (freq[2] !== undefined) {
        osc.frequency.linearRampToValueAtTime(freq[2], now + recipe.dur);
      }
    }

    // Gain envelope (attack → peak → decay → 0)
    const vol = recipe.vol !== undefined ? recipe.vol : 0.25;
    const atk = recipe.atk || 0.005;
    const dur = recipe.dur || 0.15;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + atk);
    gain.gain.setValueAtTime(vol, now + atk);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Optional distortion
    let node = osc;
    if (recipe.dist) {
      const dist = c.createWaveShaper();
      const amount = recipe.dist;
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
      }
      dist.curve = curve;
      osc.connect(dist);
      node = dist;
    }

    // Optional filter
    if (recipe.filter) {
      const flt = c.createBiquadFilter();
      flt.type = recipe.filter.type || 'lowpass';
      flt.frequency.value = recipe.filter.freq || 2000;
      flt.Q.value = recipe.filter.q || 1;
      node.connect(flt);
      flt.connect(gain);
    } else {
      node.connect(gain);
    }

    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  // Plays two sounds with a delay between them
  function playSeq(recipes, gap) {
    gap = gap || 0.08;
    recipes.forEach(function(r, i) {
      setTimeout(function() { play(r); }, i * gap * 1000);
    });
  }

  // ─── SOUND LIBRARY ──────────────────────────────────────────────

  const SOUNDS = {

    click: function() {
      play({ wave:'sine', freq:[800, 400], vol:0.12, atk:0.001, dur:0.06 });
    },

    jump: function() {
      play({ wave:'square', freq:[200, 600], vol:0.18, atk:0.005, dur:0.18,
             filter:{ type:'lowpass', freq:1200 } });
    },

    land: function() {
      play({ wave:'square', freq:[150, 80], vol:0.22, atk:0.001, dur:0.1,
             filter:{ type:'lowpass', freq:400 } });
    },

    hit: function() {
      play({ wave:'sawtooth', freq:[300, 150], vol:0.25, atk:0.001, dur:0.1, dist:80 });
    },

    shoot: function() {
      play({ wave:'sawtooth', freq:[800, 200, 100], vol:0.15, atk:0.001, dur:0.12,
             filter:{ type:'highpass', freq:600 } });
    },

    coin: function() {
      playSeq([
        { wave:'sine', freq:[880], vol:0.2, atk:0.001, dur:0.08 },
        { wave:'sine', freq:[1320], vol:0.2, atk:0.001, dur:0.1 }
      ], 0.06);
    },

    bounce: function() {
      play({ wave:'sine', freq:[400, 800], vol:0.2, atk:0.001, dur:0.1 });
    },

    beep: function() {
      play({ wave:'square', freq:[660], vol:0.15, atk:0.002, dur:0.08,
             filter:{ type:'bandpass', freq:800, q:2 } });
    },

    error: function() {
      playSeq([
        { wave:'sawtooth', freq:[300], vol:0.2, atk:0.002, dur:0.1, dist:40 },
        { wave:'sawtooth', freq:[200], vol:0.2, atk:0.002, dur:0.12, dist:40 }
      ], 0.1);
    },

    whoosh: function() {
      play({ wave:'sawtooth', freq:[1200, 200], vol:0.12, atk:0.01, dur:0.25,
             filter:{ type:'bandpass', freq:600, q:0.5 } });
    },

    powerup: function() {
      playSeq([
        { wave:'sine', freq:[440], vol:0.18, atk:0.005, dur:0.08 },
        { wave:'sine', freq:[554], vol:0.18, atk:0.005, dur:0.08 },
        { wave:'sine', freq:[659], vol:0.18, atk:0.005, dur:0.08 },
        { wave:'sine', freq:[880], vol:0.22, atk:0.005, dur:0.15 }
      ], 0.07);
    },

    level: function() {
      playSeq([
        { wave:'square', freq:[523], vol:0.18, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:1800 } },
        { wave:'square', freq:[659], vol:0.18, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:1800 } },
        { wave:'square', freq:[784], vol:0.18, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:1800 } },
        { wave:'square', freq:[1047], vol:0.22, atk:0.005, dur:0.2,
          filter:{ type:'lowpass', freq:1800 } }
      ], 0.1);
    },

    win: function() {
      playSeq([
        { wave:'square', freq:[523], vol:0.2, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:2000 } },
        { wave:'square', freq:[659], vol:0.2, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:2000 } },
        { wave:'square', freq:[784], vol:0.2, atk:0.005, dur:0.1,
          filter:{ type:'lowpass', freq:2000 } },
        { wave:'square', freq:[523, 1047], vol:0.25, atk:0.005, dur:0.4,
          filter:{ type:'lowpass', freq:2000 } }
      ], 0.11);
    },

    lose: function() {
      playSeq([
        { wave:'sawtooth', freq:[400], vol:0.2, atk:0.005, dur:0.12, dist:30 },
        { wave:'sawtooth', freq:[300], vol:0.2, atk:0.005, dur:0.12, dist:30 },
        { wave:'sawtooth', freq:[200], vol:0.2, atk:0.005, dur:0.12, dist:30 },
        { wave:'sawtooth', freq:[150], vol:0.22, atk:0.005, dur:0.3,  dist:50 }
      ], 0.12);
    }

  };

  // ─── PUBLIC API ─────────────────────────────────────────────────

  GH.sound = function(name) {
    if (SOUNDS[name]) SOUNDS[name]();
  };

  GH.mute = function() {
    muted = true;
    localStorage.setItem('gh_muted', '1');
  };

  GH.unmute = function() {
    muted = false;
    localStorage.setItem('gh_muted', '0');
  };

  GH.toggleMute = function() {
    if (muted) GH.unmute(); else GH.mute();
    return muted;
  };

  GH.isMuted = function() { return muted; };

  // Expose raw play() for custom one-off sounds in individual games
  GH.playRaw = play;

})(window.GH);
