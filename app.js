/* Practice Hub — timer + log, all data in localStorage */

// Line icons, drawn with the text color (see .icon in styles.css).
// Each entry is the inside of a 24x24 <svg>.
const ICONS = {
  violin:     '<g transform="rotate(45 12 12)"><path d="M12-2v20.5M10.3-.5h3.4M10.3 1.5h3.4M10.2 18.5h3.6"/><path d="M12 7c-2.6 0-4.2 1.6-4.2 3.6 0 1.2.6 2 1.4 2.6-.3.5-.3 1.1 0 1.6-1.3.8-2.4 2.3-2.4 4.4 0 2.9 2.3 4.8 5.2 4.8s5.2-1.9 5.2-4.8c0-2.1-1.1-3.6-2.4-4.4.3-.5.3-1.1 0-1.6.8-.6 1.4-1.4 1.4-2.6C16.2 8.6 14.6 7 12 7z"/></g>',
  book:       '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  pencil:     '<path d="M17 3l4 4L8 20l-5 1 1-5z"/><path d="M14 6l4 4"/>',
  keyboard:   '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  volleyball: '<circle cx="12" cy="12" r="9"/><path d="M12 12c0-4-2.5-6.5-6-7M12 12c3.5 2 7 1.5 8.7-1M12 12c-3.5 2-4.5 5.5-3 8.5"/>',
  feather:    '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22M17.5 15H9"/>',
  math:       '<path d="M5 7.5h5M7.5 5v5M14 7.5h5M5.7 14.7l3.6 3.6M9.3 14.7l-3.6 3.6M14 15h5M14 18h5"/>',
  broom:      '<path d="M20 3l-7.5 7.5"/><path d="M10.5 8.5l5 5-2.5 6.5c-4.5 0-8-3-9-8z"/><path d="M7.5 13.5l3 3"/>',
  home:       '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  today:      '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  flame:      '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:      '<path d="m5 12 5 5 9-10"/>',
  dice:       '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
  shuffle:    '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  sparkle:    '<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
  star:       '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
};

function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
}

document.querySelectorAll("[data-icon]").forEach(function (el) {
  el.innerHTML = icon(el.dataset.icon);
});

const ACTIVITIES = [
  { id: "violin",     name: "Violin",     icon: "violin", minutes: 20 },
  { id: "reading",    name: "Reading",    icon: "book", minutes: 20 },
  { id: "homework",   name: "Homework",   icon: "pencil", minutes: 30 },
  { id: "typing",     name: "Typing",     icon: "keyboard", minutes: 10 },
  { id: "volleyball", name: "Volleyball", icon: "volleyball", minutes: 30 },
  { id: "writing",    name: "Writing",    icon: "feather", minutes: 10 },
  { id: "math",       name: "Math",       icon: "math", minutes: 10 },
  { id: "cleanup",    name: "Cleanup",    icon: "broom", minutes: 10 },
];

// The timer lengths offered on every activity. "minutes" above is just
// which one starts out selected.
const DURATIONS = [10, 20, 30];

const LS_KEY = "practiceHub.log.v1";

/* ---------- storage ---------- */
function loadLog() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveLogEntry(entry) {
  const log = loadLog();
  log.push(entry);
  try { localStorage.setItem(LS_KEY, JSON.stringify(log)); } catch (e) {}
}

function localDay(d) {
  const x = d || new Date();
  return x.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function activityById(id) {
  return ACTIVITIES.find(function (a) { return a.id === id; });
}

/* ---------- view routing ---------- */
const viewEl = document.getElementById("view");
const overlayRoot = document.getElementById("overlay-root");
let currentView = "home";
let timerState = null; // {activity, totalSec, remainingSec, endAt, running, intervalId}

document.querySelectorAll(".tab").forEach(function (btn) {
  btn.addEventListener("click", function () { showView(btn.dataset.view); });
});

function showView(name) {
  pauseTimer();
  currentView = name;
  document.querySelectorAll(".tab").forEach(function (b) {
    b.classList.toggle("active", b.dataset.view === name);
  });
  if (name === "home") renderHome();
  else if (name === "today") renderToday();
  else if (name === "streak") renderStreak();
  else if (name === "history") renderHistory();
  else if (name === "timer") renderTimer();
  window.scrollTo(0, 0);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- home ---------- */
function renderHome() {
  let html = '<h2 class="view-title">What are we practicing?</h2><div class="grid">';
  ACTIVITIES.forEach(function (a) {
    html += '<button class="card" data-activity="' + a.id + '">' +
      '<span class="card-emoji">' + icon(a.icon) + '</span>' +
      '<span class="card-name">' + esc(a.name) + '</span>' +
      '<span class="card-mins">' + a.minutes + ' min</span></button>';
  });
  html += "</div>";
  viewEl.innerHTML = html;
  viewEl.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("click", function () { openTimer(c.dataset.activity); });
  });
}

/* ---------- timer ---------- */
function openTimer(activityId) {
  const a = activityById(activityId);
  if (!a) return;
  timerState = {
    activity: a,
    totalSec: a.minutes * 60,
    remainingSec: a.minutes * 60,
    endAt: null,
    running: false,
    intervalId: null,
    storyView: null,
    activeStoryId: null,
  };
  currentView = "timer";
  document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
  renderTimer();
  window.scrollTo(0, 0);
}

function fmt(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m < 10 ? "0" + m : "" + m) + ":" + (s < 10 ? "0" + s : "" + s);
}

function renderTimer() {
  const t = timerState;
  if (!t) { showView("home"); return; }
  const a = t.activity;

  let html = '<div class="timer-wrap">' +
    '<button class="timer-back" id="timer-back">\u2190 All activities</button>' +
    '<div class="timer-emoji">' + icon(a.icon) + '</div>' +
    '<div class="timer-name">' + esc(a.name) + '</div>' +
    '<div class="time-options" role="radiogroup" aria-label="Timer length">';
  DURATIONS.forEach(function (m) {
    html += '<label class="time-option"><input type="radio" name="minutes" value="' + m + '"' +
      (t.totalSec === m * 60 ? " checked" : "") + '><span>' + m + ' min</span></label>';
  });
  html += '</div>' +
    '<div class="timer-display" id="timer-display">' + fmt(t.remainingSec) + '</div>' +
    '<div class="timer-btns">' +
      '<button class="btn ' + (t.running ? "btn-pause" : "btn-start") + '" id="timer-toggle">' +
        (t.running ? "Pause" : (t.remainingSec < t.totalSec ? "Resume" : "Start")) + '</button>' +
      '<button class="btn btn-reset" id="timer-reset">Reset</button>' +
    '</div>' +
    '<div class="timer-btns"><button class="btn btn-done" id="timer-done">Done \u2713</button></div>';

  if (a.id === "writing") {
    html += '<div class="writing-panel"><h3>' + icon("feather") + ' Writing</h3>' +
      '<div id="stories-mode"></div></div>';
  }
  html += "</div>";
  viewEl.innerHTML = html;

  document.getElementById("timer-back").addEventListener("click", function () { showView("home"); });
  document.getElementById("timer-toggle").addEventListener("click", toggleTimer);
  document.getElementById("timer-reset").addEventListener("click", resetTimer);
  document.getElementById("timer-done").addEventListener("click", finishEarly);
  viewEl.querySelectorAll('input[name="minutes"]').forEach(function (r) {
    r.addEventListener("change", function () { setMinutes(+r.value); });
  });

  if (a.id === "writing") {
    renderStoriesMode();
  }
}

function updateDisplay() {
  const el = document.getElementById("timer-display");
  if (el && timerState) el.textContent = fmt(timerState.remainingSec);
  const btn = document.getElementById("timer-toggle");
  if (btn && timerState) {
    btn.textContent = timerState.running ? "Pause" : (timerState.remainingSec < timerState.totalSec ? "Resume" : "Start");
    btn.className = "btn " + (timerState.running ? "btn-pause" : "btn-start");
  }
}

function toggleTimer() {
  const t = timerState;
  if (!t) return;
  if (t.running) { pauseTimer(); }
  else {
    t.running = true;
    t.endAt = Date.now() + t.remainingSec * 1000;
    t.intervalId = setInterval(tick, 250);
  }
  updateDisplay();
}

function tick() {
  const t = timerState;
  if (!t || !t.running) return;
  t.remainingSec = Math.max(0, (t.endAt - Date.now()) / 1000);
  updateDisplay();
  if (t.remainingSec <= 0) completeTimer();
}

function pauseTimer() {
  const t = timerState;
  if (t && t.intervalId) { clearInterval(t.intervalId); t.intervalId = null; }
  if (t) t.running = false;
}

function resetTimer() {
  const t = timerState;
  if (!t) return;
  pauseTimer();
  t.remainingSec = t.totalSec;
  updateDisplay();
}

// Picking a different length starts the countdown over at that length
function setMinutes(minutes) {
  const t = timerState;
  if (!t) return;
  pauseTimer();
  t.totalSec = minutes * 60;
  t.remainingSec = t.totalSec;
  updateDisplay();
}

function currentWords() {
  const ta = document.getElementById("chapter-text");
  if (!ta) return null;
  const v = ta.value.trim();
  return v === "" ? 0 : v.split(/\s+/).filter(Boolean).length;
}

function logCompletion(minutes) {
  const t = timerState;
  const entry = {
    date: localDay(),
    activityId: t.activity.id,
    activityName: t.activity.name,
    minutes: minutes,
    ts: Date.now(),
  };
  const words = currentWords();
  if (t.activity.id === "writing" && words !== null && words > 0) entry.words = words;
  saveLogEntry(entry);
}

function completeTimer() {
  const t = timerState;
  if (!t) return;
  pauseTimer();
  t.remainingSec = 0;
  logCompletion(Math.round(t.totalSec / 60));
  celebrate(t.activity);
}

function finishEarly() {
  const t = timerState;
  if (!t) return;
  pauseTimer();
  const elapsedSec = t.totalSec - t.remainingSec;
  const minutes = Math.max(1, Math.round(elapsedSec / 60));
  logCompletion(minutes);
  celebrate(t.activity);
}

function celebrate(activity) {
  const shapes = [icon("star"), icon("sparkle")];
  for (let i = 0; i < 45; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
    s.style.left = Math.random() * 100 + "vw";
    s.style.fontSize = 18 + Math.random() * 26 + "px";
    s.style.animationDuration = 2 + Math.random() * 1.8 + "s";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 4200);
  }
  overlayRoot.innerHTML =
    '<div class="overlay"><div class="overlay-card">' +
    '<div class="overlay-emoji">' + icon(activity.icon) + '</div>' +
    '<h2>Amazing!</h2>' +
    '<p>' + esc(activity.name) + ' logged. Keep that streak going!</p>' +
    '<button class="btn btn-done" id="overlay-done">Done</button>' +
    '</div></div>';
  document.getElementById("overlay-done").addEventListener("click", function () {
    overlayRoot.innerHTML = "";
    timerState = null;
    showView("today");
  });
}

/* ---------- today ---------- */
function renderToday() {
  const log = loadLog();
  const today = localDay();
  const doneIds = {};
  log.forEach(function (e) { if (e.date === today) doneIds[e.activityId] = true; });

  let html = '<h2 class="view-title">Today \u2014 ' + esc(prettyDate(new Date())) + '</h2>';
  ACTIVITIES.forEach(function (a) {
    const done = !!doneIds[a.id];
    html += '<div class="todo-row' + (done ? " done" : "") + '">' +
      '<span class="todo-emoji">' + icon(a.icon) + '</span>' +
      '<div class="todo-info"><div class="todo-name">' + esc(a.name) + '</div>' +
      '<div class="todo-sub">' + a.minutes + ' min' + (done ? " \u00B7 done!" : "") + '</div></div>' +
      '<span class="todo-check">' + (done ? icon("check") : "") + '</span></div>';
  });
  viewEl.innerHTML = html;
}

function prettyDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/* ---------- streak ---------- */
function streakInfo() {
  const days = {};
  loadLog().forEach(function (e) { days[e.date] = true; });
  let streak = 0;
  const d = new Date();
  if (!days[localDay(d)]) d.setDate(d.getDate() - 1);
  while (days[localDay(d)]) { streak++; d.setDate(d.getDate() - 1); }
  return { days: days, streak: streak };
}

function renderStreak() {
  const info = streakInfo();
  let html = '<h2 class="view-title">Streak</h2>' +
    '<div class="streak-hero"><div class="streak-num">' + icon("flame") + ' ' + info.streak + '</div>' +
    '<div class="streak-label">' + (info.streak === 1 ? "day" : "days") +
    ' in a row with at least one practice!</div></div>' +
    '<h2 class="view-title">Last 14 days</h2><div class="dots">';

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const hit = !!info.days[localDay(d)];
    const label = d.toLocaleDateString("en-US", { weekday: "narrow" });
    html += '<div><div class="dot' + (hit ? " hit" : "") + '">' + icon("star") + '</div>' +
      '<div class="dot-day">' + label + '</div></div>';
  }
  html += "</div>";
  viewEl.innerHTML = html;
}

/* ---------- history ---------- */
function renderHistory() {
  const log = loadLog().slice().sort(function (x, y) { return y.ts - x.ts; });
  if (!log.length) {
    viewEl.innerHTML = '<h2 class="view-title">History</h2>' +
      '<div class="empty">No practices logged yet.<br>Tap an activity on Home to start!</div>';
    return;
  }
  const groups = {};
  log.forEach(function (e) {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dates = Object.keys(groups).sort().reverse();

  let html = '<h2 class="view-title">History</h2>';
  dates.forEach(function (date) {
    const d = new Date(date + "T12:00:00");
    html += '<div class="hist-day">' + esc(prettyDate(d)) + '</div>';
    groups[date].forEach(function (e) {
      const a = activityById(e.activityId) || { icon: "check", name: e.activityName };
      html += '<div class="hist-row"><span class="hist-emoji">' + icon(a.icon) + '</span>' +
        '<span>' + esc(e.activityName) + ' \u00B7 ' + e.minutes + ' min</span>' +
        (e.words ? '<span class="hist-words">' + e.words + ' words</span>' : '') + '</div>';
    });
  });
  viewEl.innerHTML = html;
}

/* ---------- story mode ---------- */

const STORY_STARTERS = [
  "The school bus took a wrong turn this morning \u2014 and nobody but you seemed to notice. Out the window, the streets looked\u2026 different.",
  "You found a key in your violin case. It wasn't there yesterday. Taped to it is a note: \u2018Don't let them hear you coming.\u2019",
  "At exactly midnight, every dog in the neighborhood started barking at the same time. Yours included \u2014 and she was staring at YOUR closet.",
  "The new kid at school handed you a folded paper and whispered, \u2018Read this when you're alone.\u2019 You just opened it.",
  "Your volleyball floated straight up during practice and didn't come down. An hour later, it tapped on your bedroom window.",
  "Mom said the attic was empty. So why did you just hear footsteps up there \u2014 spelling out your name in Morse code?",
  "The ice cream truck came down your street in December. The driver waved at you specifically \u2014 and pointed at the back door.",
  "You woke up and your left shoe was missing. In its place was a tiny scroll that said: \u2018Follow the red thread.\u2019",
  "During the fire drill, you counted the kids in your class. There was one extra \u2014 and nobody else could see them.",
  "The library book you checked out has notes in the margins. Today's note says: \u2018Turn to page 47 at 4:47 PM. Trust me.\u2019",
  "Your plant moved. You're sure of it. It was by the window this morning; now it's by the door, and there's dirt on the floor spelling something.",
  "A pigeon landed on your windowsill carrying a miniature backpack. Inside is a map of YOUR house \u2014 with one room circled."
];

const STORIES_KEY = "practiceHub.stories.v1";
const WORD_GOAL = 100;

function loadStories() {
  try {
    const raw = localStorage.getItem(STORIES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveStories(s) {
  try { localStorage.setItem(STORIES_KEY, JSON.stringify(s)); } catch (e) {}
}

function storyById(id) {
  return loadStories().find(function (s) { return s.id === id; });
}

function updateStory(story) {
  saveStories(loadStories().map(function (s) { return s.id === story.id ? story : s; }));
}

function newestStory() {
  const all = loadStories().slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  return all.length ? all[0] : null;
}

function storyTitle(s) {
  return s.starter.length > 48 ? s.starter.slice(0, 48) + "\u2026" : s.starter;
}

function countWords(text) {
  const v = String(text || "").trim();
  return v === "" ? 0 : v.split(/\s+/).filter(Boolean).length;
}

function draftKey(id) { return "practiceHub.storydraft." + id; }
function saveDraft(id, v) { try { localStorage.setItem(draftKey(id), v); } catch (e) {} }
function loadDraft(id) { try { return localStorage.getItem(draftKey(id)) || ""; } catch (e) { return ""; } }
function clearDraft(id) { try { localStorage.removeItem(draftKey(id)); } catch (e) {} }

function renderStoriesMode() {
  const t = timerState;
  const box = document.getElementById("stories-mode");
  if (!t || !box) return;
  if (!t.storyView) t.storyView = "shelf";

  let html = "";
  if (t.storyView === "pick") html = starterPickHtml();
  else if (t.storyView === "write") {
    const s = storyById(t.activeStoryId);
    if (s) html = storyWriteHtml(s);
    else { t.storyView = "shelf"; html = storiesShelfHtml(); }
  } else if (t.storyView === "read") {
    const s = storyById(t.activeStoryId);
    if (s) html = storyReadHtml(s);
    else { t.storyView = "shelf"; html = storiesShelfHtml(); }
  } else html = storiesShelfHtml();

  box.innerHTML = html;
  wireStoriesMode();
}

/* ----- shelf: new story vs continue ----- */

function storiesShelfHtml() {
  const last = newestStory();
  let html = '<div class="story-choices">' +
    '<button class="story-choice" id="new-story-btn"><span class="choice-emoji">' + icon("sparkle") + '</span>' +
    '<span class="choice-label">New story</span>' +
    '<span class="choice-sub">Pick a starter</span></button>';

  if (last) {
    const touchedYesterday = last.updatedAt < new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    html += '<button class="story-choice continue" id="continue-story-btn"><span class="choice-emoji">' + icon("book") + '</span>' +
      '<span class="choice-label">' + (touchedYesterday ? "Continue yesterday\u2019s story" : "Continue your story") + '</span>' +
      '<span class="choice-sub">' + esc(storyTitle(last)) + '</span></button>';
  }
  html += '</div>';

  const rest = loadStories().slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  const older = last ? rest.filter(function (s) { return s.id !== last.id; }) : rest;
  if (older.length) {
    html += '<h3 class="pick-title">Earlier stories</h3>';
    older.forEach(function (s) {
      const n = s.chapters.length;
      html += '<button class="shelf-row" data-story="' + s.id + '">' +
        '<span class="shelf-emoji">' + icon("book") + '</span>' +
        '<span class="shelf-info"><span class="shelf-snippet">' + esc(storyTitle(s)) + '</span>' +
        '<span class="shelf-meta">' + n + (n === 1 ? " chapter" : " chapters") + '</span></span>' +
        '<span class="shelf-go">\u203A</span></button>';
    });
  } else if (!last) {
    html += '<div class="empty">No stories yet.<br>Start a new one above!</div>';
  }
  return html;
}

/* ----- starter pick ----- */

function pickStarters() {
  const idxs = [];
  while (idxs.length < 3 && idxs.length < STORY_STARTERS.length) {
    const i = Math.floor(Math.random() * STORY_STARTERS.length);
    if (idxs.indexOf(i) === -1) idxs.push(i);
  }
  return idxs;
}

function starterPickHtml() {
  let html = '<button class="timer-back" id="story-back">\u2190 All stories</button>';
  html += '<h3 class="pick-title">Pick a story starter</h3><div class="starter-cards">';
  pickStarters().forEach(function (i) {
    html += '<button class="starter-card" data-starter-idx="' + i + '">' + esc(STORY_STARTERS[i]) + '</button>';
  });
  html += '</div><button class="prompt-btn" id="shuffle-starters">' + icon("shuffle") + ' Shuffle</button>';
  return html;
}

/* ----- write a chapter ----- */

function storyWriteHtml(story) {
  let html = '<button class="timer-back" id="story-back">\u2190 All stories</button>';
  html += '<div class="story-start"><div class="story-start-label">The story so far</div><p>' +
    esc(story.starter) + '</p></div>';

  story.chapters.forEach(function (c, i) {
    html += '<div class="chapter"><span class="chapter-num">Ch. ' + (i + 1) +
      '</span><p>' + esc(c.text) + '</p></div>';
  });

  const draft = loadDraft(story.id);
  html += '<textarea id="chapter-text" placeholder="What happens next? Write Chapter ' +
    (story.chapters.length + 1) + '\u2026">' + esc(draft) + '</textarea>';
  html += '<div class="goal-bar"><div class="goal-fill" id="goal-fill"></div></div>' +
    '<div class="word-count"><span id="chapter-words">0</span> / ' + WORD_GOAL + ' words</div>';
  html += '<button class="btn btn-done" id="save-chapter">Save chapter \u2713</button>';
  return html;
}

/* ----- read back ----- */

function storyReadHtml(story) {
  let html = '<button class="timer-back" id="story-back">\u2190 All stories</button>';
  html += '<div class="read-story"><h3>' + esc(storyTitle(story)) + '</h3>';
  html += '<p class="read-starter">' + esc(story.starter) + '</p>';
  story.chapters.forEach(function (c, i) {
    html += '<p class="read-chapter-head"><strong>Chapter ' + (i + 1) + '</strong></p>';
    html += '<p>' + esc(c.text) + '</p>';
  });
  html += '</div>';
  html += '<button class="btn btn-start" id="continue-story">Continue this story</button>';
  return html;
}

/* ----- wiring ----- */

function wireStoriesMode() {
  const t = timerState;
  if (!t) return;
  const box = document.getElementById("stories-mode");
  if (!box) return;

  const newBtn = document.getElementById("new-story-btn");
  if (newBtn) newBtn.addEventListener("click", function () { t.storyView = "pick"; renderStoriesMode(); });

  const contBtn = document.getElementById("continue-story-btn");
  if (contBtn) contBtn.addEventListener("click", function () {
    const last = newestStory();
    if (!last) return;
    t.activeStoryId = last.id;
    t.storyView = "write";
    renderStoriesMode();
  });

  box.querySelectorAll(".shelf-row").forEach(function (row) {
    row.addEventListener("click", function () {
      t.activeStoryId = row.dataset.story;
      t.storyView = "read";
      renderStoriesMode();
    });
  });

  box.querySelectorAll("#story-back").forEach(function (b) {
    b.addEventListener("click", function () {
      t.storyView = "shelf";
      t.activeStoryId = null;
      renderStoriesMode();
    });
  });

  const shuffle = document.getElementById("shuffle-starters");
  if (shuffle) shuffle.addEventListener("click", renderStoriesMode);

  box.querySelectorAll(".starter-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const story = {
        id: "st" + Date.now(),
        starter: STORY_STARTERS[+card.dataset.starterIdx],
        chapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const all = loadStories();
      all.push(story);
      saveStories(all);
      t.activeStoryId = story.id;
      t.storyView = "write";
      renderStoriesMode();
    });
  });

  const ta = document.getElementById("chapter-text");
  if (ta) {
    updateChapterCount();
    ta.addEventListener("input", function () {
      saveDraft(t.activeStoryId, ta.value);
      updateChapterCount();
    });
  }

  const saveBtn = document.getElementById("save-chapter");
  if (saveBtn) saveBtn.addEventListener("click", saveChapter);

  const cont2 = document.getElementById("continue-story");
  if (cont2) cont2.addEventListener("click", function () {
    t.storyView = "write";
    renderStoriesMode();
  });
}

function updateChapterCount() {
  const ta = document.getElementById("chapter-text");
  if (!ta) return;
  const n = countWords(ta.value);
  const el = document.getElementById("chapter-words");
  if (el) el.textContent = n;
  const fill = document.getElementById("goal-fill");
  if (fill) fill.style.width = Math.min(100, Math.round(n / WORD_GOAL * 100)) + "%";
}

function saveChapter() {
  const t = timerState;
  const ta = document.getElementById("chapter-text");
  if (!t || !ta) return;
  const text = ta.value.trim();
  if (!text) return;
  const s = storyById(t.activeStoryId);
  if (!s) return;
  s.chapters.push({ text: text, date: localDay(), ts: Date.now() });
  s.updatedAt = Date.now();
  updateStory(s);
  clearDraft(s.id);
  t.storyView = "read";
  renderStoriesMode();
}

/* ---------- init ---------- */
showView("home");
