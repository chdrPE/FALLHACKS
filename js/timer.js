document.addEventListener("DOMContentLoaded", () => {
  // ---- Config ----
  const rounds = [
    { label: "Round 1", minutes: 20 },
    { label: "Round 2", minutes: 40 },
    { label: "Round 3", minutes: 20 },
  ];
  const beepMoments = [10, 5, 3, 2, 1];

  // ---- State ----
  let idx = 0, running = false, secondsLeft = rounds[idx].minutes * 60;
  let soundOn = true, autopause = true, intervalId = null;

  // ---- DOM ----
  const timeEl = document.getElementById("time");
  const labelEl = document.getElementById("roundLabel");
  const startPauseBtn = document.getElementById("startPause");
  const resetBtn = document.getElementById("reset");
  const nextBtn = document.getElementById("next");
  const soundBtn = document.getElementById("sound");
  const autopauseChk = document.getElementById("autopause");
  const pauseReason = document.getElementById("pauseReason");
  const roundsUl = document.getElementById("rounds");
  const completedEl = document.getElementById("completed");
  const totalEl = document.getElementById("total");
  totalEl.textContent = rounds.length;

  // ---- Ring ----
  const progressEl = document.getElementById("progress");
  const R = parseFloat(progressEl.getAttribute("r"));       // 170
  const C = 2 * Math.PI * R;                                // circumference
  progressEl.style.strokeDasharray = C;
  progressEl.style.strokeDashoffset = C;                    // start empty

  // ---- Audio (WebAudio) ----
  let audioCtx = null;
  const ensureAudio = () => {
    if (!soundOn) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  };
  const beep = (freq = 880, duration = 0.12, volume = 0.05) => {
    const ctx = ensureAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = freq; osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  };

  // ---- UI helpers ----
  const mmss = t => `${String(Math.floor(t/60)).padStart(2,"0")}:${String(Math.floor(t%60)).padStart(2,"0")}`;
  const setProgress = p => progressEl.style.strokeDashoffset = C * (1 - Math.min(1, Math.max(0, p)));
  const updateUI = () => {
    timeEl.textContent = mmss(secondsLeft);
    labelEl.textContent = rounds[idx] ? rounds[idx].label : "All rounds completed";
    const total = rounds[idx] ? rounds[idx].minutes * 60 : 1;
    setProgress((total - secondsLeft) / total);
    document.body.classList.toggle("urgent", running && secondsLeft <= 10);
    startPauseBtn.textContent = running ? "Pause" : "Start";
    nextBtn.disabled = idx >= rounds.length - 1;
    completedEl.textContent = idx;
  };

  const renderRounds = () => {
    roundsUl.innerHTML = "";
    rounds.forEach((r, i) => {
      const li = document.createElement("li");
      const status = i < idx ? "completed" : i === idx ? "inprogress" : "upcoming";
      li.className = "round";
      li.innerHTML = `
        <div class="info">
          <span class="dot ${status === "completed" ? "completed" : status === "inprogress" ? "inprogress" : ""}"></span>
          <div><div class="title">${r.label}</div><div class="minutes">${r.minutes} min</div></div>
        </div>
        <button class="btn-plain" ${i === idx ? "disabled" : ""}>${i === idx ? "Active" : "Go"}</button>
      `;
      li.querySelector("button").addEventListener("click", () => {
        idx = i; running = false; secondsLeft = rounds[idx].minutes * 60;
        pauseReason.classList.add("hidden"); updateUI(); renderRounds();
      });
      roundsUl.appendChild(li);
    });
  };

  // ---- Timer ----
  function tick() {
    if (!running) return;
    secondsLeft = Math.max(0, secondsLeft - 1);

    // urgency: beep & vibrate
    if (secondsLeft > 0 && secondsLeft <= 10 && beepMoments.includes(secondsLeft)) {
      if (soundOn) beep(secondsLeft === 10 ? 660 : 880, 0.09, 0.06);
      if (navigator.vibrate) navigator.vibrate(40);
    }
    if (secondsLeft === 0) {
      if (soundOn) { beep(880, 0.12, 0.07); setTimeout(() => beep(660, 0.12, 0.07), 130); }
      pause(); setTimeout(next, 250);
    }
    updateUI();
  }

  const start = () => { if (running) return; running = true; pauseReason.classList.add("hidden"); ensureAudio(); tick(); intervalId = setInterval(tick, 1000); updateUI(); };
  const pause = () => { running = false; if (intervalId) clearInterval(intervalId); updateUI(); };
  const reset = () => { pause(); secondsLeft = rounds[idx].minutes * 60; updateUI(); };
  const next = () => { pause(); idx = Math.min(rounds.length - 1, idx + 1); secondsLeft = rounds[idx].minutes * 60; updateUI(); renderRounds(); };

  // ---- Events ----
  startPauseBtn.addEventListener("click", () => running ? pause() : start());
  resetBtn.addEventListener("click", reset);
  nextBtn.addEventListener("click", next);
  soundBtn.addEventListener("click", () => { soundOn = !soundOn; soundBtn.textContent = `Sound: ${soundOn ? "ON" : "OFF"}`; soundBtn.setAttribute("aria-pressed", String(soundOn)); ensureAudio(); });
  autopauseChk.addEventListener("change", e => autopause = e.target.checked);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && autopause && running) { pause(); pauseReason.classList.remove("hidden"); }
  });
  window.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); running ? pause() : start(); }
    else if (e.key.toLowerCase() === "r") reset();
    else if (e.key.toLowerCase() === "n") next();
  });

  // init
  renderRounds(); updateUI();
});
