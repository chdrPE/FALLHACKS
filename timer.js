/* ====== Config inicial ====== */
const ROUNDS = [
  { label: "Round 1", minutes: 20 },
  { label: "Round 2", minutes: 40 },
  { label: "Round 3", minutes: 20 },
];

let idx = 0;
let running = false;
let soundOn = true;
let autoPauseOnTab = true;
let secondsLeft = ROUNDS[idx].minutes * 60;
let intervalId = null;
let audioCtx = null;

/* ====== DOM ====== */
const timeEl = document.getElementById("time");
const roundLabelEl = document.getElementById("roundLabel");
const ringProgress = document.querySelector(".ring-progress");
const btnStartPause = document.getElementById("btnStartPause");
const btnReset = document.getElementById("btnReset");
const btnNext = document.getElementById("btnNext");
const btnSound = document.getElementById("btnSound");
const chkAutoPause = document.getElementById("chkAutoPause");
const pausedBanner = document.getElementById("pausedBanner");
const roundList = document.getElementById("roundList");
const completedCountEl = document.getElementById("completedCount");
const totalRoundsEl = document.getElementById("totalRounds");

/* ====== SVG métricas ====== */
const RADIUS = parseFloat(ringProgress.getAttribute("r")); // 170
const CIRC = 2 * Math.PI * RADIUS;
ringProgress.style.strokeDasharray = CIRC;
ringProgress.style.strokeDashoffset = CIRC; // empieza vacío

/* ====== Util ====== */
const mmss = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function ensureAudio() {
  if (!soundOn) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

function beep(freq = 880, duration = 0.12, volume = 0.05) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/* ====== Render ====== */
function render() {
  // tiempo & etiqueta
  timeEl.textContent = mmss(secondsLeft);
  roundLabelEl.textContent = ROUNDS[idx] ? ROUNDS[idx].label : "All rounds completed";

  // progreso del anillo (0→1)
  const total = ROUNDS[idx] ? ROUNDS[idx].minutes * 60 : 1;
  const progress = Math.min(1, Math.max(0, (total - secondsLeft) / total));
  ringProgress.style.strokeDashoffset = CIRC * (1 - progress);

  // urgencia visual
  const urgent = running && secondsLeft <= 10 && secondsLeft > 0;
  ringProgress.classList.toggle("urgent", urgent);
  timeEl.classList.toggle("pulse", urgent);

  // botones
  btnStartPause.textContent = running ? "Pause" : "Start";
  btnNext.disabled = idx >= ROUNDS.length - 1;

  // lista de rondas
  roundList.innerHTML = "";
  ROUNDS.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "round-item";

    const left = document.createElement("div");
    left.className = "round-left";
    const badge = document.createElement("span");
    badge.className = "badge " + (i < idx ? "completed" : i === idx ? "in-progress" : "upcoming");
    const textWrap = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = r.label;
    const meta = document.createElement("div");
    meta.className = "round-meta";
    meta.textContent = `${r.minutes} min`;
    textWrap.appendChild(title);
    textWrap.appendChild(meta);
    left.appendChild(badge);
    left.appendChild(textWrap);

    const btnGo = document.createElement("button");
    btnGo.className = "round-go";
    btnGo.textContent = i === idx ? "Active" : "Go";
    btnGo.disabled = i === idx;
    btnGo.addEventListener("click", () => {
      idx = i;
      running = false;
      secondsLeft = ROUNDS[idx].minutes * 60;
      pausedBanner.hidden = true;
      render();
    });

    li.appendChild(left);
    li.appendChild(btnGo);
    roundList.appendChild(li);
  });

  completedCountEl.textContent = idx;
  totalRoundsEl.textContent = ROUNDS.length;
}

/* ====== Lógica del timer ====== */
function tick() {
  if (!running) return;
  secondsLeft = Math.max(0, secondsLeft - 1);

  // vibración + beeps en cuenta regresiva
  if (secondsLeft <= 10 && secondsLeft > 0) {
    if (navigator.vibrate) navigator.vibrate(40);
    if (soundOn && [10, 5, 3, 2, 1].includes(secondsLeft)) {
      beep(secondsLeft === 10 ? 660 : 880, 0.09, 0.06);
    }
  }

  if (secondsLeft === 0) {
    if (soundOn) {
      beep(880, 0.12, 0.07);
      setTimeout(() => beep(660, 0.12, 0.07), 130);
    }
    running = false;
    // pasar a la siguiente ronda automáticamente
    setTimeout(() => {
      if (idx < ROUNDS.length - 1) {
        idx += 1;
        secondsLeft = ROUNDS[idx].minutes * 60;
      }
      render();
    }, 250);
  }

  render();
}

/* ====== Eventos ====== */
btnStartPause.addEventListener("click", () => {
  running = !running;
  pausedBanner.hidden = true;
  ensureAudio(); // desbloquea audio con interacción
  render();
});
btnReset.addEventListener("click", () => {
  running = false;
  secondsLeft = ROUNDS[idx].minutes * 60;
  render();
});
btnNext.addEventListener("click", () => {
  running = false;
  if (idx < ROUNDS.length - 1) idx += 1;
  secondsLeft = ROUNDS[idx].minutes * 60;
  render();
});

btnSound.addEventListener("click", () => {
  soundOn = !soundOn;
  btnSound.textContent = `Sound: ${soundOn ? "On" : "Off"}`;
});

chkAutoPause.addEventListener("change", (e) => {
  autoPauseOnTab = e.target.checked;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && autoPauseOnTab && running) {
    running = false;
    pausedBanner.hidden = false;
    render();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    btnStartPause.click();
  } else if (e.key.toLowerCase() === "r") {
    btnReset.click();
  } else if (e.key.toLowerCase() === "n") {
    btnNext.click();
  }
});

/* ====== Bucle ====== */
intervalId = setInterval(tick, 1000);
render();
