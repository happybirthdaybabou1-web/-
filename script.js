// ================= EDIT THESE =================
const CONFIG = {
  name: "Babou",
  from: "Yash",
  candles: 5,
  message:
    "Another trip around the sun, and you made it look easy.\n" +
    "Thank you for the laughs, the help when deadlines got loud, and for making Mondays lighter. " +
    "Here's to a year of big wins, small joys, and plenty more cake.",
  realGift: "Your real gift is waiting at your desk. Go and look!",
  popWords: ["Babou!", "Babouuu!", "B-A-B-O-U", "It's Babou day", "Bab-WOO!", "Happy bday Babou", "Babou szn"]
};
// ==============================================

const $ = (s) => document.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const page = document.body.dataset.page;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/* ---------------- confetti (both pages) ---------------- */
const canvas = $("#confetti");
const cctx = canvas.getContext("2d");
const COLORS = ["#E63962", "#FFB627", "#BFE8D4", "#3D1A4A", "#FFFFFF", "#FFF1B5"];
let pieces = [];
let confettiRaf = null;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

function burst(x, y, count) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x, y,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 17 - 5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  }
  if (!confettiRaf) tick();
}

function tick() {
  cctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of pieces) {
    p.vy += 0.35;
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.r);
    cctx.fillStyle = p.c;
    cctx.strokeStyle = "#3D1A4A";
    cctx.lineWidth = 1;
    const h = p.h * Math.abs(Math.cos(p.r * 2)) + 1;
    cctx.fillRect(-p.w / 2, -h / 2, p.w, h);
    cctx.strokeRect(-p.w / 2, -h / 2, p.w, h);
    cctx.restore();
  }
  pieces = pieces.filter((p) => p.y < innerHeight + 40);
  confettiRaf = pieces.length ? requestAnimationFrame(tick) : null;
  if (!pieces.length) cctx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ---------------- sounds ---------------- */
function popSound() {
  try {
    const ctx = getAudio();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(700 + Math.random() * 300, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.12);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.16);
  } catch (e) { /* sound is optional */ }
}

/* ======================================================
   HOME PAGE: the cake
   ====================================================== */
if (page === "home") {
  let micStream = null;
  let micRaf = null;
  let typeTimer = null;
  let candlesLeft = 0;

  document.title = `Happy birthday, ${CONFIG.name}!`;
  document.querySelectorAll(".name").forEach((el) => (el.textContent = CONFIG.name));

  const show = (id) => {
    document.querySelectorAll(".scene").forEach((s) => s.classList.add("hidden"));
    $(id).classList.remove("hidden");
  };

  /* ----- Babou pops: click anywhere ----- */
  const POP_BG = ["#FFFFFF", "#FFF1B5", "#BFE8D4", "#FFB627"];
  function popAt(x, y) {
    const el = document.createElement("span");
    el.className = "pop";
    el.textContent = CONFIG.popWords[Math.floor(Math.random() * CONFIG.popWords.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = POP_BG[Math.floor(Math.random() * POP_BG.length)];
    el.style.color = "#E63962";
    el.style.setProperty("--r", `${Math.round(Math.random() * 24 - 12)}deg`);
    $("#pops").appendChild(el);
    el.addEventListener("animationend", () => el.remove());
    setTimeout(() => el.remove(), 2000);
    popSound();
    burst(x, y, 20);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    popAt(e.clientX, e.clientY);
  });

  /* ----- candles ----- */
  function buildCandles() {
    const wrap = $("#candles");
    wrap.innerHTML = "";
    candlesLeft = CONFIG.candles;
    for (let i = 0; i < CONFIG.candles; i++) {
      const c = document.createElement("button");
      c.className = "candle";
      c.setAttribute("aria-label", `Blow out candle ${i + 1}`);
      c.style.height = `${46 + (i % 2) * 12}px`;
      c.innerHTML = '<span class="flame"></span><span class="smoke"></span>';
      c.addEventListener("click", () => blowOut(c));
      wrap.appendChild(c);
    }
  }

  function blowOut(c) {
    if (c.classList.contains("out")) return;
    c.classList.add("out");
    c.disabled = true;
    candlesLeft--;
    if (!micStream) puff();
    if (candlesLeft === 0) {
      $("#hint").textContent = "Wish made.";
      setTimeout(celebrate, 1000);
    }
  }

  function puff() {
    try {
      const ctx = getAudio();
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buf;
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      gain.gain.value = 0.15;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
    } catch (e) { /* sound is optional */ }
  }

  /* ----- microphone ----- */
  async function startMic() {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      $("#hint").textContent = "The microphone is blocked, so tap each candle to blow it out.";
      $("#micBtn").hidden = true;
      return;
    }
    const ctx = getAudio();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(micStream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    $("#micBtn").hidden = true;
    $("#hint").textContent = "Listening. Blow at your screen!";

    let blowFrames = 0;
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) {
        const x = (v - 128) / 128;
        sum += x * x;
      }
      const rms = Math.sqrt(sum / data.length);
      $("#cake").style.setProperty("--lean", `${Math.min(rms * 300, 45)}deg`);

      if (rms > 0.12) {
        blowFrames++;
        if (blowFrames > 8) {
          blowFrames = 0;
          const lit = [...document.querySelectorAll(".candle:not(.out)")];
          if (lit.length) blowOut(lit[Math.floor(Math.random() * lit.length)]);
        }
      } else {
        blowFrames = Math.max(0, blowFrames - 1);
      }
      if (candlesLeft > 0) micRaf = requestAnimationFrame(loop);
      else stopMic();
    };
    loop();
  }

  function stopMic() {
    cancelAnimationFrame(micRaf);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
    $("#cake").style.setProperty("--lean", "0deg");
  }

  /* ----- celebration ----- */
  function celebrate() {
    stopMic();
    show("#wish");

    const title = $("#bigTitle");
    const text = `Happy birthday, ${CONFIG.name}!`;
    title.innerHTML = "";
    title.setAttribute("aria-label", text);
    let n = 0;
    text.split(" ").forEach((word, wi, words) => {
      const w = document.createElement("span");
      w.className = "word";
      w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        s.style.animationDelay = `${n++ * 45}ms`;
        w.appendChild(s);
      });
      title.appendChild(w);
      if (wi < words.length - 1) title.appendChild(document.createTextNode(" "));
    });

    clearInterval(typeTimer);
    const msg = $("#message");
    const sign = $("#sign");
    msg.textContent = "";
    sign.textContent = "";
    if (reduceMotion) {
      msg.textContent = CONFIG.message;
      sign.textContent = `— ${CONFIG.from}`;
    } else {
      let i = 0;
      typeTimer = setInterval(() => {
        msg.textContent = CONFIG.message.slice(0, ++i);
        if (i >= CONFIG.message.length) {
          clearInterval(typeTimer);
          sign.textContent = `— ${CONFIG.from}`;
        }
      }, 28);
    }

    burst(innerWidth / 2, innerHeight * 0.6, 200);
    setTimeout(() => burst(innerWidth * 0.15, innerHeight, 90), 400);
    setTimeout(() => burst(innerWidth * 0.85, innerHeight, 90), 650);
  }

  /* ----- the song (public domain melody) ----- */
  function playSong() {
    const ctx = getAudio();
    const F = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
    const tune = [
      ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
      ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
      ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
      ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]
    ];
    const beat = 0.42;
    const start = ctx.currentTime + 0.05;
    let t = start;
    for (const [note, len] of tune) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = F[note];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len * beat * 0.95);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len * beat);
      t += len * beat;
    }
    return (t - start) * 1000;
  }

  /* ----- wiring ----- */
  $("#lightBtn").addEventListener("click", () => {
    getAudio();
    buildCandles();
    show("#cakeScene");
  });

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $("#micBtn").hidden = true;
    $("#hint").textContent = "Make a wish, then tap each candle to blow it out.";
  }
  $("#micBtn").addEventListener("click", startMic);

  $("#songBtn").addEventListener("click", () => {
    const btn = $("#songBtn");
    btn.disabled = true;
    btn.textContent = "Playing…";
    const ms = playSong();
    burst(innerWidth / 2, innerHeight, 80);
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Play the song";
      burst(innerWidth / 2, innerHeight * 0.5, 160);
    }, ms);
  });

  $("#againBtn").addEventListener("click", () => {
    clearInterval(typeTimer);
    buildCandles();
    $("#hint").textContent = "Make a wish, then blow into your microphone. Or tap each candle.";
    $("#micBtn").hidden = !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    show("#cakeScene");
  });
}

/* ======================================================
   GIFT PAGE: the prank
   ====================================================== */
if (page === "gift") {
  const overlay = $("#overlay");
  const stepsEl = $("#steps");
  const reveal = $("#reveal");
  const modalTitle = $("#modalTitle");
  const nick = CONFIG.name;

  const steps = [
    `Connecting to the ${nick} servers`,
    `Verifying ${nick}-ness: 100%`,
    "Applying birthday discount: −100%",
    "Charging your card… wait, what card?"
  ];

  let running = false;
  async function subscribe() {
    if (running) return;
    running = true;
    overlay.hidden = false;
    modalTitle.textContent = "Processing your subscription";
    modalTitle.focus();
    stepsEl.innerHTML = "";
    reveal.hidden = true;

    for (const text of steps) {
      const li = document.createElement("li");
      li.innerHTML = '<span class="spinner" aria-hidden="true"></span><span></span>';
      li.lastChild.textContent = text;
      stepsEl.appendChild(li);
      await sleep(reduceMotion ? 300 : 1100);
      li.firstChild.outerHTML = '<span class="check" aria-hidden="true">✓</span>';
    }

    await sleep(400);
    stepsEl.innerHTML = "";
    modalTitle.textContent = "Well, well, well…";
    $("#realGift").textContent = CONFIG.realGift;
    reveal.hidden = false;
    popSound();
    burst(innerWidth / 2, innerHeight / 2, 220);
    setTimeout(() => burst(innerWidth * 0.2, innerHeight, 100), 300);
    setTimeout(() => burst(innerWidth * 0.8, innerHeight, 100), 500);
    running = false;
  }
  document.querySelectorAll(".subscribe").forEach((b) => b.addEventListener("click", subscribe));

  // "No thanks" link that dodges the mouse
  const nope = $("#nopeBtn");
  const nopeLines = ["Too late", "That's not an option", `${nick}, please`, "Just pick a plan", "Nope"];
  let ni = 0;
  const dodge = () => {
    if (reduceMotion) return;
    const x = (Math.random() * 2 - 1) * Math.min(220, innerWidth / 2 - 100);
    const y = (Math.random() * 2 - 1) * 60;
    nope.style.translate = `${x}px ${y}px`;
  };
  nope.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") dodge(); });
  nope.addEventListener("click", () => {
    nope.textContent = nopeLines[ni++ % nopeLines.length];
    dodge();
  });
}
