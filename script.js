// ================= EDIT THESE =================
const CONFIG = {
  realName: "Sheri",   // used on the reveal page (scratch card / balloons)
  nickname: "Babou",   // used on the party page and in the pops
  // Which reveal she gets first: "scratch", "balloons" or "box"
  scene: "scratch",
  realGift: "Your real gift is waiting at your desk. Go and look!",
  popWords: ["Babou!", "Babouuu!", "B-A-B-O-U", "It's Babou day", "Bab-WOO!", "Happy bday Babou", "Babou szn"]
};
// ==============================================

const $ = (s) => document.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const page = document.body.dataset.page;

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

function resizeConfetti() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resizeConfetti);
resizeConfetti();

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

function bigCelebration() {
  burst(innerWidth / 2, innerHeight * 0.6, 200);
  setTimeout(() => burst(innerWidth * 0.15, innerHeight, 90), 400);
  setTimeout(() => burst(innerWidth * 0.85, innerHeight, 90), 650);
}

/* ---------------- pop sound ---------------- */
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
   HOME PAGE
   ====================================================== */
if (page === "home") {
  const nick = CONFIG.nickname;
  const realName = CONFIG.realName;
  const sceneId = { balloons: "#balloonScene", scratch: "#scratchScene", box: "#boxScene" }[CONFIG.scene] || "#scratchScene";

  document.querySelectorAll(".real-name").forEach((el) => (el.textContent = realName));

  const show = (id) => {
    document.querySelectorAll(".scene").forEach((s) => s.classList.add("hidden"));
    $(id).classList.remove("hidden");
  };

  /* ----- name pops: click anywhere ----- */
  const POP_BG = ["#FFFFFF", "#FFF1B5", "#BFE8D4", "#FFB627"];
  function popAt(x, y) {
    const el = document.createElement("span");
    el.className = "pop";
    el.textContent = CONFIG.popWords[Math.floor(Math.random() * CONFIG.popWords.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = POP_BG[Math.floor(Math.random() * POP_BG.length)];
    el.style.setProperty("--r", `${Math.round(Math.random() * 24 - 12)}deg`);
    $("#pops").appendChild(el);
    el.addEventListener("animationend", () => el.remove());
    setTimeout(() => el.remove(), 2000);
    popSound();
    burst(x, y, 20);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("a, button, #ticket")) return;
    popAt(e.clientX, e.clientY);
  });

  /* ----- 2a. balloons ----- */
  const BALLOON_COLORS = ["#E63962", "#FFB627", "#BFE8D4", "#FFF1B5", "#FFFFFF"];
  const NUMBERS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  function setupBalloons() {
    const letters = [...realName.toUpperCase()];
    const wrap = $("#balloons");
    wrap.innerHTML = "";
    $("#balloonHint").textContent = `${NUMBERS[letters.length] || letters.length} balloons. One secret word. Pop them all.`;
    let left = letters.length;

    letters.forEach((letter, i) => {
      const slot = document.createElement("div");
      slot.className = "balloon-slot";
      const b = document.createElement("button");
      b.className = "balloon";
      b.setAttribute("aria-label", `Pop balloon ${i + 1}`);
      b.style.setProperty("--c", BALLOON_COLORS[i % BALLOON_COLORS.length]);
      b.style.setProperty("--d", `${-i * 0.6}s`);
      b.style.setProperty("--t", `${i % 2 ? 4 : -4}deg`);
      slot.append(b);
      slot.insertAdjacentHTML("beforeend", '<span class="knot" aria-hidden="true"></span><span class="string" aria-hidden="true"></span>');

      b.addEventListener("click", () => {
        const r = b.getBoundingClientRect();
        popSound();
        burst(r.left + r.width / 2, r.top + r.height / 2, 40);
        slot.innerHTML = "";
        slot.classList.add("popped");
        const card = document.createElement("span");
        card.className = "letter";
        card.textContent = letter;
        slot.append(card);
        if (--left === 0) setTimeout(celebrate, 1100);
      });
      wrap.append(slot);
    });
  }

  /* ----- 2b. scratch card ----- */
  const ticket = $("#ticket");
  const scratch = $("#scratch");
  const sctx = scratch.getContext("2d");
  let scratchDone = false;
  let drawing = false;
  let last = null;
  let moves = 0;

  function paintScratch() {
    const w = ticket.clientWidth;
    const h = ticket.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    scratch.width = w * dpr;
    scratch.height = h * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.globalCompositeOperation = "source-over";
    sctx.fillStyle = "#C9C4CF";
    sctx.fillRect(0, 0, w, h);
    sctx.strokeStyle = "#B7B1BE";
    sctx.lineWidth = 6;
    for (let x = -h; x < w; x += 12) {
      sctx.beginPath();
      sctx.moveTo(x, 0);
      sctx.lineTo(x + h, h);
      sctx.stroke();
    }
    sctx.fillStyle = "#3D1A4A";
    sctx.font = "600 22px 'DM Sans', sans-serif";
    sctx.textAlign = "center";
    sctx.fillText("Scratch here", w / 2, h / 2 + 8);
  }

  function scratchTo(x, y) {
    sctx.globalCompositeOperation = "destination-out";
    sctx.lineWidth = 46;
    sctx.lineCap = "round";
    sctx.lineJoin = "round";
    sctx.beginPath();
    sctx.moveTo(last ? last.x : x, last ? last.y : y);
    sctx.lineTo(x + 0.01, y + 0.01);
    sctx.stroke();
    last = { x, y };
  }

  function clearedShare() {
    const { data } = sctx.getImageData(0, 0, scratch.width, scratch.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      total++;
      if (data[i] < 128) clear++;
    }
    return clear / total;
  }

  function revealTicket() {
    if (scratchDone) return;
    scratchDone = true;
    scratch.classList.add("gone");
    const r = ticket.getBoundingClientRect();
    popSound();
    burst(r.left + r.width / 2, r.top + r.height / 2, 120);
    setTimeout(celebrate, 2200);
  }

  scratch.addEventListener("pointerdown", (e) => {
    if (scratchDone) return;
    drawing = true;
    last = null;
    scratch.setPointerCapture(e.pointerId);
    scratchTo(e.offsetX, e.offsetY);
  });
  scratch.addEventListener("pointermove", (e) => {
    if (!drawing || scratchDone) return;
    scratchTo(e.offsetX, e.offsetY);
    if (++moves % 20 === 0 && clearedShare() > 0.5) revealTicket();
  });
  const stopScratch = () => {
    if (!drawing) return;
    drawing = false;
    last = null;
    if (!scratchDone && clearedShare() > 0.5) revealTicket();
  };
  scratch.addEventListener("pointerup", stopScratch);
  scratch.addEventListener("pointercancel", stopScratch);
  $("#revealBtn").addEventListener("click", revealTicket);
  addEventListener("resize", () => {
    if (!scratchDone && !$("#scratchScene").classList.contains("hidden")) paintScratch();
  });

  function setupScratch() {
    scratchDone = false;
    scratch.classList.remove("gone");
    paintScratch();
  }

  /* ----- 2c. gift box ----- */
  const box = $("#box");
  const ribbonBtn = $("#ribbonBtn");
  function setupBox() {
    box.classList.remove("open");
    ribbonBtn.disabled = false;
  }
  ribbonBtn.addEventListener("click", () => {
    ribbonBtn.disabled = true;
    box.classList.add("open");
    popSound();
    const r = box.getBoundingClientRect();
    setTimeout(() => burst(r.left + r.width / 2, r.top + 60, 160), 250);
    setTimeout(celebrate, 1500);
  });

  /* ----- start the chosen scene ----- */
  function startScene() {
    show(sceneId);
    if (sceneId === "#balloonScene") setupBalloons();
    if (sceneId === "#scratchScene") setupScratch();
    if (sceneId === "#boxScene") setupBox();
  }

  /* ----- 3. the party ----- */
  function celebrate() {
    show("#party");
    const title = $("#bigTitle");
    const text = `Happy birthday, ${nick}!`;
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
    bigCelebration();
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
  $("#startBtn").addEventListener("click", () => {
    getAudio();
    startScene();
  });

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

  $("#againBtn").addEventListener("click", startScene);

  // coming back from the gift page jumps straight to the party
  if (location.hash === "#party") celebrate();
}

/* ======================================================
   GIFT PAGE: the prank
   Any click (or tap) anywhere shows the monkey for 3 seconds,
   then the "Gotcha!" pop-up. Nothing is stored or sent anywhere.
   ====================================================== */
if (page === "gift") {
  const monkey = $("#monkey");
  const overlay = $("#overlay");
  let caught = false;

  function gotcha() {
    if (caught) return;
    caught = true;
    $("#realGift").textContent = CONFIG.realGift;

    // 1. monkey pops up
    monkey.hidden = false;
    popSound();

    // 2. after 3 seconds it fades away and the gotcha appears
    setTimeout(() => monkey.classList.add("fade"), 2400);
    setTimeout(() => {
      monkey.hidden = true;
      overlay.hidden = false;
      $("#gotTitle").focus();
      popSound();
      bigCelebration();
    }, 3000);
  }

  // Block every click on the page (except inside the gotcha pop-up) and trigger the prank
  document.addEventListener("click", (e) => {
    if (e.target.closest("#overlay")) return;
    e.preventDefault();
    e.stopPropagation();
    gotcha();
  }, true);
}
