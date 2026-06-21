// ============================================
// Stopwatch — App Logic
// ============================================

const timeDisplay = document.getElementById("timeDisplay");
const dialProgress = document.getElementById("dialProgress");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const lapList = document.getElementById("lapList");
const emptyState = document.getElementById("emptyState");

const CIRCUMFERENCE = 2 * Math.PI * 86; // matches the SVG circle radius

let running = false;
let startedAt = 0;       // performance.now() when current run began
let elapsedBeforeMs = 0; // accumulated elapsed time across previous runs
let rafId = null;
let laps = [];           // { totalMs, splitMs }

// ---------- Time helpers ----------
function getElapsedMs() {
  return running ? elapsedBeforeMs + (performance.now() - startedAt) : elapsedBeforeMs;
}

function formatTime(ms) {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad = (n) => String(n).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`
    : `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

// ---------- Render loop ----------
function renderFrame() {
  const elapsed = getElapsedMs();
  timeDisplay.textContent = formatTime(elapsed);

  const secondsIntoMinute = (elapsed / 1000) % 60;
  const fraction = secondsIntoMinute / 60;
  dialProgress.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - fraction));

  if (running) {
    rafId = requestAnimationFrame(renderFrame);
  }
}

// ---------- Button state ----------
function updateButtons() {
  const elapsed = getElapsedMs();

  if (running) {
    rightBtn.textContent = "Pause";
    rightBtn.classList.add("running");
    leftBtn.textContent = "Lap";
    leftBtn.classList.remove("reset-mode");
    leftBtn.disabled = false;
  } else {
    rightBtn.textContent = elapsed > 0 ? "Resume" : "Start";
    rightBtn.classList.remove("running");

    if (elapsed > 0) {
      leftBtn.textContent = "Reset";
      leftBtn.classList.add("reset-mode");
      leftBtn.disabled = false;
    } else {
      leftBtn.textContent = "Lap";
      leftBtn.classList.remove("reset-mode");
      leftBtn.disabled = true;
    }
  }

  dialProgress.classList.toggle("running", running);
  dialProgress.classList.toggle("paused", !running && elapsed > 0);
}

// ---------- Actions ----------
function start() {
  if (running) return;
  running = true;
  startedAt = performance.now();
  rafId = requestAnimationFrame(renderFrame);
  updateButtons();
}

function pause() {
  if (!running) return;
  elapsedBeforeMs = getElapsedMs();
  running = false;
  cancelAnimationFrame(rafId);
  renderFrame(); // settle display on the exact paused value
  updateButtons();
}

function reset() {
  if (running) return;
  elapsedBeforeMs = 0;
  laps = [];
  renderLaps();
  renderFrame();
  updateButtons();
}

function addLap() {
  if (!running) return;
  const total = getElapsedMs();
  const previousTotal = laps.length > 0 ? laps[0].totalMs : 0;
  const split = total - previousTotal;
  laps.unshift({ totalMs: total, splitMs: split });
  renderLaps();
}

// ---------- Lap rendering ----------
function renderLaps() {
  lapList.innerHTML = "";
  emptyState.classList.toggle("show", laps.length === 0);

  if (laps.length === 0) return;

  let fastestIdx = -1;
  let slowestIdx = -1;
  if (laps.length >= 2) {
    let fastest = Infinity;
    let slowest = -Infinity;
    laps.forEach((lap, i) => {
      if (lap.splitMs < fastest) {
        fastest = lap.splitMs;
        fastestIdx = i;
      }
      if (lap.splitMs > slowest) {
        slowest = lap.splitMs;
        slowestIdx = i;
      }
    });
  }

  laps.forEach((lap, i) => {
    const lapNumber = laps.length - i;
    const li = document.createElement("li");
    li.className = "lap-row";
    if (i === fastestIdx) li.classList.add("fastest");
    if (i === slowestIdx) li.classList.add("slowest");

    li.innerHTML = `
      <span class="lap-num">#${lapNumber}</span>
      <span class="lap-split">${formatTime(lap.splitMs)}</span>
      <span class="lap-total">${formatTime(lap.totalMs)}</span>
    `;
    lapList.appendChild(li);
  });
}

// ---------- Events ----------
rightBtn.addEventListener("click", () => {
  running ? pause() : start();
});

leftBtn.addEventListener("click", () => {
  if (running) {
    addLap();
  } else if (getElapsedMs() > 0) {
    reset();
  }
});

// ---------- Init ----------
renderFrame();
updateButtons();
renderLaps();
