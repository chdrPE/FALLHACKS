document.addEventListener("DOMContentLoaded", () => {
  /* ========= A) FONDO ANIMADO (independiente del main.js) ========= */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const circles = [];
  const colors = ['#5697a8ff', '#a6b6c8ff', '#10aee8ff', '#ffffffff']; // paleta cálida
  function createCircles(num){
    for(let i=0;i<num;i++){
      circles.push({
        x: Math.random()*width,
        y: Math.random()*height,
        r: Math.random()*22 + 6,
        dx: (Math.random()-0.5)*1.4,
        dy: (Math.random()-0.5)*1.4,
        color: colors[Math.floor(Math.random()*colors.length)],
        alpha: Math.random()*0.35 + 0.25
      });
    }
  }
  function drawCircle(c){
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r*2.2);
    const rgb = hexToRgb(c.color);
    g.addColorStop(0, `rgba(${rgb},${c.alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(c.x, c.y, c.r*2.2, 0, Math.PI*2);
    ctx.fill();
  }
  function animateBg(){
    ctx.clearRect(0,0,width,height);
    // capa base (azul profundo, consistente con --blue-bg)
    ctx.fillStyle = '#0A2540';
    ctx.fillRect(0,0,width,height);
    // blend suave de luces
    ctx.globalCompositeOperation = 'lighter';
    circles.forEach(c=>{
      c.x += c.dx; c.y += c.dy;
      if(c.x < -50) c.x = width+50; if(c.x > width+50) c.x = -50;
      if(c.y < -50) c.y = height+50; if(c.y > height+50) c.y = -50;
      drawCircle(c);
    });
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(animateBg);
  }
  function hexToRgb(hex){
    const n = parseInt(hex.slice(1),16);
    const r = (n>>16)&255, g=(n>>8)&255, b=n&255;
    return `${r},${g},${b}`;
  }
  createCircles(60);
  animateBg();
  window.addEventListener('resize', ()=>{
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  /* ========= B) TIMER CIRCULAR ========= */
  // --- Configurable (edita aquí las duraciones) ---
  const rounds = [
    { label: "Round 1", minutes: 20 },
    { label: "Round 2", minutes: 40 },
    { label: "Round 3", minutes: 60 },
  ];
  const beepMoments = [10,5,3,2,1];

  // --- Estado ---
  let idx = 0, running = false, secondsLeft = rounds[idx].minutes * 60;
  let soundOn = true, autopause = true, intervalId = null;

  // --- DOM ---
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

  // --- Anillo SVG ---
  const progressEl = document.getElementById("progress");
  const R = parseFloat(progressEl.getAttribute("r")); // 170
  const C = 2 * Math.PI * R;
  progressEl.style.strokeDasharray = C;
  progressEl.style.strokeDashoffset = C; // empieza vacío

  // --- Audio (WebAudio) ---
  let audioCtx = null;
  const ensureAudio = () => {
    if (!soundOn) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  };
  const beep = (freq=880, duration=0.12, vol=0.05) => {
    const ctx = ensureAudio(); if(!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = freq; osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  };

  // --- Helpers ---
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
    rounds.forEach((r,i)=>{
      const li = document.createElement("li");
      const status = i<idx ? "completed" : i===idx ? "inprogress" : "upcoming";
      li.className = "round";
      li.innerHTML = `
        <div class="info">
          <span class="dot ${status==="completed"?"completed":status==="inprogress"?"inprogress":""}"></span>
          <div><div class="title">${r.label}</div><div class="minutes">${r.minutes} min</div></div>
        </div>
        <button class="btn ${i===idx?'':'btn-primary'}" ${i===idx?"disabled":""}>${i===idx?"Active":"Go"}</button>
      `;
      li.querySelector("button").addEventListener("click", ()=>{
        idx = i; running = false; secondsLeft = rounds[idx].minutes*60;
        pauseReason.classList.add("hidden"); updateUI(); renderRounds();
      });
      roundsUl.appendChild(li);
    });
  };

  // --- Lógica del timer ---
  function tick(){
    if(!running) return;
    secondsLeft = Math.max(0, secondsLeft - 1);

    if(secondsLeft>0 && secondsLeft<=10){
      if(beepMoments.includes(secondsLeft) && soundOn) beep(secondsLeft===10?660:880, .09, .06);
      if(navigator.vibrate) navigator.vibrate(40);
    }
    if(secondsLeft===0){
      if(soundOn){ beep(880,.12,.07); setTimeout(()=>beep(660,.12,.07),130); }
      pause(); setTimeout(next, 250);
    }
    updateUI();
  }
  const start = ()=>{ if(running) return; running=true; pauseReason.classList.add("hidden"); ensureAudio(); tick(); intervalId=setInterval(tick,1000); updateUI(); };
  const pause = ()=>{ running=false; if(intervalId) clearInterval(intervalId); updateUI(); };
  const reset = ()=>{ pause(); secondsLeft = rounds[idx].minutes*60; updateUI(); };
  const next  = ()=>{ pause(); idx = Math.min(rounds.length-1, idx+1); secondsLeft = rounds[idx].minutes*60; updateUI(); renderRounds(); };

  // --- Eventos ---
  document.addEventListener("visibilitychange", ()=>{
    if(document.hidden && autopause && running){ pause(); pauseReason.classList.remove("hidden"); }
  });
  startPauseBtn.addEventListener("click", ()=> running ? pause() : start());
  resetBtn.addEventListener("click", reset);
  nextBtn.addEventListener("click", next);
  soundBtn.addEventListener("click", ()=>{
    soundOn = !soundOn;
    soundBtn.textContent = `Sound: ${soundOn ? "ON" : "OFF"}`;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    ensureAudio();
  });
  document.getElementById("autopause").addEventListener("change", e => autopause = e.target.checked);
  window.addEventListener("keydown", e=>{
    if(e.code==="Space"){ e.preventDefault(); running ? pause() : start(); }
    else if(e.key.toLowerCase()==="r") reset();
    else if(e.key.toLowerCase()==="n") next();
  });

  // --- Init ---
  renderRounds(); updateUI();
});