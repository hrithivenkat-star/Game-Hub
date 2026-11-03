/* ============================================================================
   Game Hub — Loading screen (shared/loader.js)
   One tag, no other markup needed. Put it FIRST in <head> so it shows instantly:
     <script src="/shared/loader.js"></script>
   Optional: <script src="/shared/loader.js" data-min="1200"></script>  (min ms on screen)
   It covers the page, then fades out once everything has loaded.
   ============================================================================ */
(function () {
  if (window.__ghLoader) return;
  var tag = document.currentScript;
  var MIN = Number((tag && tag.getAttribute('data-min')) || 1100); // shortest time shown (ms)
  var MAX = 7000;                                                    // failsafe: never trap the player
  var start = Date.now();

  var css = '' +
  '#gh-loader{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;' +
    'background:radial-gradient(ellipse 70% 55% at 50% 38%,#3a1259 0%,#150c26 55%,#0a0714 100%);color:#fbf2ff;' +
    'transition:opacity .55s ease,visibility .55s ease,transform .55s ease}' +
  '#gh-loader.gh-out{opacity:0;visibility:hidden;transform:scale(1.04);pointer-events:none}' +
  '#gh-loader *{box-sizing:border-box}' +
  /* city skyline */
  '#gh-loader .gl-city{position:absolute;left:0;right:0;bottom:0;height:34%;opacity:.55;pointer-events:none;' +
    'background:' +
    'linear-gradient(180deg,transparent,#0a0714 92%),' +
    'repeating-linear-gradient(90deg,#1b0f33 0 38px,#120a24 38px 46px,#22123f 46px 92px,#120a24 92px 100px);' +
    '-webkit-mask-image:linear-gradient(180deg,transparent,#000 40%);mask-image:linear-gradient(180deg,transparent,#000 40%)}' +
  '#gh-loader .gl-sun{position:absolute;left:50%;bottom:-18%;width:min(80vw,520px);aspect-ratio:1;border-radius:50%;transform:translateX(-50%);' +
    'background:radial-gradient(circle,#ffe27a 0%,#ffd23f 28%,#ff7a3d 58%,transparent 72%);opacity:.35;filter:blur(3px);animation:gl-pulse 2.4s ease-in-out infinite}' +
  /* ring + logo */
  '#gh-loader .gl-ring{position:relative;width:132px;height:132px;display:grid;place-items:center;z-index:2}' +
  '#gh-loader .gl-ring::before{content:"";position:absolute;inset:0;border-radius:50%;padding:4px;' +
    'background:conic-gradient(from 0deg,#ff2f87,#ff7a3d,#ffd23f,#00e0c6,#8b2ff0,#ff2f87);' +
    '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;' +
    'mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:gl-spin 1.4s linear infinite;filter:drop-shadow(0 0 12px rgba(255,47,135,.7))}' +
  '#gh-loader .gl-ring::after{content:"";position:absolute;inset:14px;border-radius:50%;border:2px dashed rgba(0,224,198,.45);animation:gl-spin 5s linear infinite reverse}' +
  '#gh-loader .gl-pad{font-size:46px;line-height:1;animation:gl-bob 1.1s ease-in-out infinite;filter:drop-shadow(0 0 14px rgba(255,47,135,.6))}' +
  /* wordmark */
  '#gh-loader .gl-word{position:relative;z-index:2;font-family:Anton,Impact,"Arial Narrow",sans-serif;font-size:clamp(40px,10vw,76px);letter-spacing:3px;line-height:1;text-transform:uppercase;' +
    'text-shadow:0 0 40px rgba(255,47,135,.45)}' +
  '#gh-loader .gl-word i{font-style:normal;background:linear-gradient(90deg,#fff,#ffe6f2);-webkit-background-clip:text;background-clip:text;color:transparent}' +
  '#gh-loader .gl-word b{font-weight:400;background:linear-gradient(90deg,#00e0c6,#7dfff0);-webkit-background-clip:text;background-clip:text;color:transparent}' +
  '#gh-loader .gl-word::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);' +
    'background-size:250% 100%;mix-blend-mode:overlay;animation:gl-shine 1.8s ease-in-out infinite}' +
  /* bar */
  '#gh-loader .gl-bar{position:relative;z-index:2;width:min(300px,72vw);height:6px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}' +
  '#gh-loader .gl-fill{position:absolute;inset:0;width:0;border-radius:6px;background:linear-gradient(90deg,#ff2f87,#ff7a3d,#ffd23f);box-shadow:0 0 14px rgba(255,122,61,.8);transition:width .25s ease-out}' +
  '#gh-loader .gl-msg{position:relative;z-index:2;margin-top:-16px;font-family:"Barlow Condensed",system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:5px;text-transform:uppercase;color:#a696c2;min-height:1.2em}' +
  '#gh-loader .gl-msg::after{content:"";animation:gl-dots 1.2s steps(4,end) infinite}' +
  'html.gh-loading,html.gh-loading body{overflow:hidden!important}' +
  '@keyframes gl-spin{to{transform:rotate(360deg)}}' +
  '@keyframes gl-bob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-7px) rotate(6deg)}}' +
  '@keyframes gl-pulse{0%,100%{opacity:.28}50%{opacity:.5}}' +
  '@keyframes gl-shine{from{background-position:150% 0}to{background-position:-150% 0}}' +
  '@keyframes gl-dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}' +
  '@media(prefers-reduced-motion:reduce){#gh-loader *,#gh-loader *::before,#gh-loader *::after{animation-duration:.001ms!important;animation-iteration-count:1!important}}';

  var style = document.createElement('style');
  style.id = 'gh-loader-css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  var el = document.createElement('div');
  el.id = 'gh-loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'Loading Game Hub');
  el.innerHTML =
    '<div class="gl-sun"></div><div class="gl-city"></div>' +
    '<div class="gl-ring"><span class="gl-pad">🎮</span></div>' +
    '<div class="gl-word"><i>GAME</i><b>HUB</b></div>' +
    '<div class="gl-bar"><div class="gl-fill"></div></div>' +
    '<div class="gl-msg"></div>';
  document.documentElement.appendChild(el);
  document.documentElement.classList.add('gh-loading');

  var fill = el.querySelector('.gl-fill');
  var msg = el.querySelector('.gl-msg');
  var lines = ['Powering up the city', 'Warming up the arcade', 'Syncing leaderboards', 'Almost there'];
  var li = 0, pct = 8, done = false;
  msg.textContent = lines[0];
  fill.style.width = pct + '%';

  // ease toward ~90% while the page loads, finish at 100% when it's ready
  var tick = setInterval(function () {
    if (done) return;
    pct += (90 - pct) * 0.09;
    fill.style.width = pct.toFixed(1) + '%';
  }, 120);
  var talk = setInterval(function () {
    if (done) return;
    li = Math.min(li + 1, lines.length - 1);
    msg.textContent = lines[li];
  }, 900);

  function finish() {
    if (done) return;
    done = true;
    clearInterval(tick); clearInterval(talk);
    fill.style.width = '100%';
    msg.textContent = 'Ready';
    setTimeout(function () {
      el.classList.add('gh-out');
      document.documentElement.classList.remove('gh-loading');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, 260);
  }

  function whenReady() {
    var wait = Math.max(0, MIN - (Date.now() - start));
    setTimeout(finish, wait);
  }

  if (document.readyState === 'complete') whenReady();
  else window.addEventListener('load', whenReady);
  setTimeout(finish, MAX);

  window.__ghLoader = { hide: finish };
})();
