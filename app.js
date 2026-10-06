/* Practice Hub — timer + log, all data in localStorage */

const ACTIVITIES = [
  { id: "violin",     name: "Violin",     emoji: "\uD83C\uDFBB", minutes: 20, accent: "#7C5CFF" },
  { id: "reading",    name: "Reading",    emoji: "\uD83D\uDCDA", minutes: 20, accent: "#2E9BFF" },
  { id: "homework",   name: "Homework",   emoji: "\u270F\uFE0F", minutes: 30, accent: "#FF9F1C" },
  { id: "typing",     name: "Typing",     emoji: "\u2328\uFE0F", minutes: 15, accent: "#00C2A8" },
  { id: "volleyball", name: "Volleyball", emoji: "\uD83C\uDFD0", minutes: 30, accent: "#FF5C7A" },
  { id: "writing",    name: "Writing",    emoji: "\u270D\uFE0F", minutes: 15, accent: "#B565FF" },
];

const PROMPTS = [
  "You wake up and your dog is wearing your clothes. What happens next?",
  "Finish the story: a mysterious box arrives at your door with your name on it. You open it and\u2026",
  "You find a hand-drawn map tucked inside a library book \u2014 and it leads somewhere in your own neighborhood\u2026",
  "Write about a day where everything goes hilariously wrong, starting with breakfast.",
  "Your backpack starts talking to you on the way to school. What does it say?",
  "Finish the story: the volleyball floated into the air and never came down\u2026",
  "You shrink to the size of an ant during recess. Describe your adventure.",
  "Invent a brand-new holiday. What is it called, and how does everyone celebrate it?",
  "A dragon moves in next door. Write about your very first conversation.",
  "Finish the story: I opened my violin case and instead of my violin I found\u2026",
  "You can trade places with any animal for one day. Which animal do you pick, and what do you do?",
  "Write a letter from the point of view of your left shoe.",
  "Your teacher announces that homework is now illegal. What happens at school the next day?",
  "Finish the story: the last slice of pizza started glowing\u2026",
  "You discover a secret room behind your bookshelf. What is inside?",
  "Write about the world's worst babysitter \u2014 and you're the kid.",
  "A time machine appears in your backyard, but it only goes back 10 minutes. What do you do with it?",
  "Finish the story: my cat knocked over the lamp, and out came\u2026",
  "You are the captain of a pirate ship made entirely of pillows. Where do you sail?",
  "Write instructions for an alien on how to make a peanut butter sandwich.",
  "Your reflection in the mirror winks at you \u2014 but you didn't wink. What happens next?",
  "Finish the story: the school bus took a wrong turn and ended up\u2026",
  "Invent a sport that combines two sports you know. Explain the rules.",
  "You find a phone that can call anyone in history. Who do you call first, and what do you ask?",
  "Write about a talent show where your act goes completely off the rails \u2014 in a funny way.",
  "Finish the story: I was practicing violin when the strings started playing by themselves\u2026",
  "Your houseplants have been holding secret meetings at night. Tonight you're invited. What happens?",
  "Describe the perfect Saturday, from the moment you wake up to bedtime."
];

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
let timerState = null; // {activity, totalSec, remainingSec, endAt, running, intervalId, lastPromptIdx}

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
  let html = '<h2 class="view-title">What are we practicing? \uD83C\uDFB5</h2><div class="grid">';
  ACTIVITIES.forEach(function (a) {
    html += '<button class="card" style="--accent:' + a.accent + '" data-activity="' + a.id + '">' +
      '<span class="card-emoji">' + a.emoji + '</span>' +
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
    writingMode: "prompts",
    storyView: null,
    activeStoryId: null,
    author: "Kate",
    lastPromptIdx: -1,
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

  let html = '<div class="timer-wrap" style="--accent:' + a.accent + '">' +
    '<button class="timer-back" id="timer-back">\u2190 All activities</button>' +
    '<div class="timer-emoji">' + a.emoji + '</div>' +
    '<div class="timer-name">' + esc(a.name) + ' \u00B7 ' + a.minutes + ' min</div>' +
    '<div class="timer-display" id="timer-display">' + fmt(t.remainingSec) + '</div>' +
    '<div class="timer-btns">' +
      '<button class="btn ' + (t.running ? "btn-pause" : "btn-start") + '" id="timer-toggle">' +
        (t.running ? "Pause" : (t.remainingSec < t.totalSec ? "Resume" : "Start")) + '</button>' +
      '<button class="btn btn-reset" id="timer-reset">Reset</button>' +
    '</div>' +
    '<div class="timer-btns"><button class="btn btn-done" id="timer-done">Done \u2713</button></div>';

  if (a.id === "writing") {
    html += '<div class="writing-panel"><h3>\u270D\uFE0F Writing</h3>' +
      '<div class="mode-tabs">' +
      '<button class="mode-tab active" id="mode-prompts">\uD83C\uDFB2 Prompts</button>' +
      '<button class="mode-tab" id="mode-stories">\uD83D\uDCDA Stories</button></div>' +
      '<div id="prompts-mode">' +
      '<div class="prompt-box" id="prompt-box">Tap \u201CNew prompt\u201D for a story idea!</div>' +
      '<button class="prompt-btn" id="prompt-btn">\uD83C\uDFB2 New prompt</button>' +
      '<textarea id="story" placeholder="Write your story here\u2026"></textarea>' +
      '<div class="word-count"><span id="word-count">0</span> words</div></div>' +
      '<div id="stories-mode" class="hidden"></div></div>';
  }
  html += "</div>";
  viewEl.innerHTML = html;

  document.getElementById("timer-back").addEventListener("click", function () { showView("home"); });
  document.getElementById("timer-toggle").addEventListener("click", toggleTimer);
  document.getElementById("timer-reset").addEventListener("click", resetTimer);
  document.getElementById("timer-done").addEventListener("click", finishEarly);

  if (a.id === "writing") {
    document.getElementById("prompt-btn").addEventListener("click", newPrompt);
    document.getElementById("story").addEventListener("input", updateWordCount);
    document.getElementById("mode-prompts").addEventListener("click", function () { setWritingMode("prompts"); });
    document.getElementById("mode-stories").addEventListener("click", function () { setWritingMode("stories"); });
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

function currentWords() {
  const t = timerState;
  let ta = null;
  if (t && t.writingMode === "stories") ta = document.getElementById("chapter-text");
  else ta = document.getElementById("story");
  if (!ta) return null;
  const v = ta.value.trim();
  return v === "" ? 0 : v.split(/\s+/).filter(Boolean).length;
}

function updateWordCount() {
  const el = document.getElementById("word-count");
  if (el) el.textContent = currentWords();
}

function newPrompt() {
  const t = timerState;
  if (!t) return;
  let idx;
  do { idx = Math.floor(Math.random() * PROMPTS.length); }
  while (idx === t.lastPromptIdx && PROMPTS.length > 1);
  t.lastPromptIdx = idx;
  document.getElementById("prompt-box").textContent = PROMPTS[idx];
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
  logCompletion(t.activity.minutes);
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
  const emojis = ["\uD83C\uDF89", "\u2B50", "\u{1F31F}", "\uD83C\uDF8A", "\u2728", "\uD83D\uDCAB"];
  for (let i = 0; i < 45; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = Math.random() * 100 + "vw";
    s.style.fontSize = 18 + Math.random() * 26 + "px";
    s.style.animationDuration = 2 + Math.random() * 1.8 + "s";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 4200);
  }
  overlayRoot.innerHTML =
    '<div class="overlay"><div class="overlay-card">' +
    '<div class="overlay-emoji">' + activity.emoji + ' \uD83C\uDF89</div>' +
    '<h2>Amazing!</h2>' +
    '<p>' + esc(activity.name) + ' logged. Keep that streak going! \uD83D\uDD25</p>' +
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
    html += '<div class="todo-row' + (done ? " done" : "") + '" style="--accent:' + a.accent + '">' +
      '<span class="todo-emoji">' + a.emoji + '</span>' +
      '<div class="todo-info"><div class="todo-name">' + esc(a.name) + '</div>' +
      '<div class="todo-sub">' + a.minutes + ' min' + (done ? " \u00B7 done!" : "") + '</div></div>' +
      '<span class="todo-check">' + (done ? "\u2705" : "\u2B1C") + '</span></div>';
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
  let html = '<h2 class="view-title">Streak \uD83D\uDD25</h2>' +
    '<div class="streak-hero"><div class="streak-num">\uD83D\uDD25 ' + info.streak + '</div>' +
    '<div class="streak-label">' + (info.streak === 1 ? "day" : "days") +
    ' in a row with at least one practice!</div></div>' +
    '<h2 class="view-title">Last 14 days</h2><div class="dots">';

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const hit = !!info.days[localDay(d)];
    const label = d.toLocaleDateString("en-US", { weekday: "narrow" });
    html += '<div><div class="dot' + (hit ? " hit" : "") + '">\u2B50</div>' +
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
      '<div class="empty">No practices logged yet.<br>Tap an activity on Home to start! \uD83C\uDFB5</div>';
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
      const a = activityById(e.activityId) || { emoji: "\u2705", name: e.activityName };
      html += '<div class="hist-row"><span class="hist-emoji">' + a.emoji + '</span>' +
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

/* ----- mode tabs ----- */

function setWritingMode(mode) {
  const t = timerState;
  if (!t) return;
  t.writingMode = mode;
  document.getElementById("mode-prompts").classList.toggle("active", mode === "prompts");
  document.getElementById("mode-stories").classList.toggle("active", mode === "stories");
  document.getElementById("prompts-mode").classList.toggle("hidden", mode !== "prompts");
  document.getElementById("stories-mode").classList.toggle("hidden", mode !== "stories");
  if (mode === "stories" && !t.storyView) t.storyView = "shelf";
  if (mode === "stories") renderStoriesMode();
}

function renderStoriesMode() {
  const t = timerState;
  const box = document.getElementById("stories-mode");
  if (!t || !box) return;
  if (!t.storyView) t.storyView = "shelf";

  let html = "";
  if (t.storyView === "pick") html = starterPickHtml();
  else if (t.storyView === "dadstart") html = dadStartHtml();
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
    '<button class="story-choice" id="new-story-btn"><span class="choice-emoji">\u2728</span>' +
    '<span class="choice-label">New story</span>' +
    '<span class="choice-sub">Pick a starter</span></button>';

  if (last) {
    const touchedYesterday = last.updatedAt < new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    html += '<button class="story-choice continue" id="continue-story-btn"><span class="choice-emoji">\uD83D\uDCDA</span>' +
      '<span class="choice-label">' + (touchedYesterday ? "Continue yesterday\u2019s story" : "Continue your story") + '</span>' +
      '<span class="choice-sub">' + esc(storyTitle(last)) + '</span></button>';
  }
  html += '</div>';

  html += '<button class="prompt-btn dad-btn" id="dad-story-btn">\uD83D\uDC68 Dad starts one</button>';

  const rest = loadStories().slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  const older = last ? rest.filter(function (s) { return s.id !== last.id; }) : rest;
  if (older.length) {
    html += '<h3 class="pick-title">Earlier stories</h3>';
    older.forEach(function (s) {
      const n = s.chapters.length;
      html += '<button class="shelf-row" data-story="' + s.id + '">' +
        '<span class="shelf-emoji">\uD83D\uDCDA</span>' +
        '<span class="shelf-info"><span class="shelf-snippet">' + esc(storyTitle(s)) + '</span>' +
        '<span class="shelf-meta">' + n + (n === 1 ? " chapter" : " chapters") + '</span></span>' +
        '<span class="shelf-go">\u203A</span></button>';
    });
  } else if (!last) {
    html += '<div class="empty">No stories yet.<br>Start a new one above! \uD83D\uDCDA</div>';
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
  html += '<h3 class="pick-title">Pick a story starter \uD83D\uDCDA</h3><div class="starter-cards">';
  pickStarters().forEach(function (i) {
    html += '<button class="starter-card" data-starter-idx="' + i + '">' + esc(STORY_STARTERS[i]) + '</button>';
  });
  html += '</div><button class="prompt-btn" id="shuffle-starters">\uD83D\uDD00 Shuffle</button>';
  return html;
}

/* ----- dad starts ----- */

function dadStartHtml() {
  return '<button class="timer-back" id="story-back">\u2190 All stories</button>' +
    '<h3 class="pick-title">\uD83D\uDC68 Dad writes the opening</h3>' +
    '<p class="dad-hint">Write 2\u20133 sentences to kick off the story. Kate writes Chapter 1 next.</p>' +
    '<textarea id="dad-opening" placeholder="It started on an ordinary Tuesday\u2026"></textarea>' +
    '<button class="btn btn-start" id="dad-start-go">Start the story \u2728</button>';
}

/* ----- write a chapter ----- */

function storyWriteHtml(story) {
  const t = timerState || { author: "Kate" };
  let html = '<button class="timer-back" id="story-back">\u2190 All stories</button>';
  html += '<div class="story-start"><div class="story-start-label">The story so far</div><p>' +
    esc(story.starter) + '</p></div>';

  story.chapters.forEach(function (c, i) {
    const who = c.author === "Dad" ? "\uD83D\uDC68 Dad" : "\uD83C\uDF1F Kate";
    html += '<div class="chapter"><span class="chapter-author ' +
      (c.author === "Dad" ? "dad" : "kate") + '">' + who + ' \u00B7 Ch. ' + (i + 1) +
      '</span><p>' + esc(c.text) + '</p></div>';
  });

  html += '<div class="author-toggle"><span>Writing as:</span>' +
    '<button class="author-btn' + (t.author !== "Dad" ? " active" : "") + '" data-author="Kate">\uD83C\uDF1F Kate</button>' +
    '<button class="author-btn' + (t.author === "Dad" ? " active" : "") + '" data-author="Dad">\uD83D\uDC68 Dad</button></div>';

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
  html += '<div class="read-story"><h3>\uD83D\uDCDA ' + esc(storyTitle(story)) + '</h3>';
  html += '<p class="read-starter">' + esc(story.starter) + '</p>';
  story.chapters.forEach(function (c, i) {
    html += '<p class="read-chapter-head"><strong>Chapter ' + (i + 1) + '</strong> ' +
      '<span class="chapter-author ' + (c.author === "Dad" ? "dad" : "kate") + '">' +
      (c.author === "Dad" ? "\uD83D\uDC68 Dad" : "\uD83C\uDF1F Kate") + '</span></p>';
    html += '<p>' + esc(c.text) + '</p>';
  });
  html += '</div>';
  html += '<button class="btn btn-start" id="continue-story">Continue this story \u270D\uFE0F</button>';
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
    t.author = "Kate";
    t.storyView = "write";
    renderStoriesMode();
  });

  const dadBtn = document.getElementById("dad-story-btn");
  if (dadBtn) dadBtn.addEventListener("click", function () { t.storyView = "dadstart"; renderStoriesMode(); });

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
      t.author = "Kate";
      t.storyView = "write";
      renderStoriesMode();
    });
  });

  const dadGo = document.getElementById("dad-start-go");
  if (dadGo) dadGo.addEventListener("click", function () {
    const v = document.getElementById("dad-opening").value.trim();
    if (!v) return;
    const story = {
      id: "st" + Date.now(),
      starter: v,
      chapters: [],
      dadStarted: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const all = loadStories();
    all.push(story);
    saveStories(all);
    t.activeStoryId = story.id;
    t.author = "Kate";
    t.storyView = "write";
    renderStoriesMode();
  });

  box.querySelectorAll(".author-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      t.author = b.dataset.author;
      box.querySelectorAll(".author-btn").forEach(function (x) {
        x.classList.toggle("active", x === b);
      });
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
    t.author = "Kate";
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
  s.chapters.push({ author: t.author || "Kate", text: text, date: localDay(), ts: Date.now() });
  s.updatedAt = Date.now();
  updateStory(s);
  clearDraft(s.id);
  t.storyView = "read";
  renderStoriesMode();
}

/* ---------- init ---------- */
showView("home");
