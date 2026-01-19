/* =====================
   DATA VOCAB
===================== */
let vocab = [];
let activeVocab = [];

async function loadVocab() {
  const res = await fetch("vocab2.csv");
  const text = await res.text();

  vocab = parseCSV(text).filter(v =>
    v.kana && v.meaning && Number.isInteger(v.lesson)
  );

  renderLessonCheckboxes();
  resetState();
}

/* =====================
   STATE
===================== */
let showKanji    = localStorage.getItem("showKanji") === "true";
let randomMode   = localStorage.getItem("randomMode") !== "false";
let kanjiOnly    = localStorage.getItem("kanjiOnly") === "true";
let showRomaji   = localStorage.getItem("showRomaji") !== "false";

let selectedLessons = JSON.parse(localStorage.getItem("selectedLessons") || "[]");

let currentIndex = 0;
let currentWord  = null;

let history = [];
let future  = [];

/* =====================
   INIT SETTINGS
===================== */
const kanjiToggle     = document.getElementById("kanjiToggle");
const randomToggle    = document.getElementById("randomToggle");
const kanjiOnlyToggle = document.getElementById("kanjiOnlyToggle");
const romajiToggle    = document.getElementById("romajiToggle");

kanjiToggle.checked     = showKanji;
randomToggle.checked    = randomMode;
kanjiOnlyToggle.checked = kanjiOnly;
romajiToggle.checked    = showRomaji;

kanjiToggle.onchange = e => {
  showKanji = e.target.checked;
  localStorage.setItem("showKanji", showKanji);
  renderQuestion();
};

romajiToggle.onchange = () => {
  showRomaji = romajiToggle.checked;
  localStorage.setItem("showRomaji", showRomaji);
  renderQuestion();
};

randomToggle.onchange = e => {
  randomMode = e.target.checked;
  localStorage.setItem("randomMode", randomMode);
  resetState();
};

kanjiOnlyToggle.onchange = e => {
  kanjiOnly = e.target.checked;
  localStorage.setItem("kanjiOnly", kanjiOnly);

  if (kanjiOnly) {
    showRomaji = false;
    romajiToggle.checked = false;
  }

  resetState();
};

/* =====================
   LESSON CHECKBOX
===================== */
function renderLessonCheckboxes() {
  const lessonSet = [...new Set(vocab.map(v => v.lesson))].sort((a, b) => a - b);
  const container = document.getElementById("lessonList");
  container.innerHTML = "";

  const isFirstLoad = !localStorage.getItem("lessonInitialized");

  lessonSet.forEach(lesson => {
    const checked = isFirstLoad || (selectedLessons && selectedLessons.includes(lesson));

    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" class="lesson" value="${lesson}" ${checked ? "checked" : ""}>
      Lesson ${lesson}
    `;
    container.appendChild(label);
  });

  if (isFirstLoad) {
    selectedLessons = lessonSet;
    localStorage.setItem("lessonInitialized", "true");
    localStorage.setItem("selectedLessons", JSON.stringify(selectedLessons));
  }

  document.querySelectorAll(".lesson").forEach(cb => cb.onchange = onLessonChange);
}

function selectAllLessons() {
  document.querySelectorAll(".lesson").forEach(cb => cb.checked = true);
  onLessonChange();
}

function clearAllLessons() {
  document.querySelectorAll(".lesson").forEach(cb => cb.checked = false);
  selectedLessons = [];
  localStorage.setItem("selectedLessons", JSON.stringify([]));
  resetState();
}

function onLessonChange() {
  selectedLessons = Array.from(document.querySelectorAll(".lesson:checked"))
                         .map(cb => Number(cb.value));
  localStorage.setItem("selectedLessons", JSON.stringify(selectedLessons));
  resetState();
}

/* =====================
   RESET & FILTER
===================== */
function resetState() {
  history = [];
  future  = [];
  currentIndex = 0;
  currentWord  = null;

  applyLessonFilter();
  clearUI();
  nextQuestion();
}

function applyLessonFilter() {
  const filtered = vocab.filter(v => {
    if (!selectedLessons.includes(v.lesson)) return false;
    if (kanjiOnly && !v.kanji) return false;
    return true;
  });

  activeVocab = randomMode ? shuffleArray(filtered) : filtered;

  if (activeVocab.length === 0) {
    console.warn("Tidak ada kosakata sesuai filter");
  }
}

/* =====================
   CORE LOGIC
===================== */
function pickWord() {
  if (activeVocab.length === 0) return null;
  const word = activeVocab[currentIndex];
  currentIndex = (currentIndex + 1) % activeVocab.length;
  return word;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderQuestion() {
  if (!currentWord) return;

  let text = "";
  if (kanjiOnly) {
    text = currentWord.kanji;
  } else if (showKanji && currentWord.kanji) {
    text = `${currentWord.kanji}（${currentWord.kana}）`;
  } else {
    text = currentWord.kana;
  }

  document.getElementById("question").innerText = text;

  const romajiEl = document.getElementById("romaji");
  if (showRomaji && currentWord.romaji) {
    romajiEl.style.display = "block";
    romajiEl.innerText = currentWord.romaji;
  } else {
    romajiEl.style.display = "none";
  }
}

function showAnswer() {
  if (!currentWord) return;
  document.getElementById("answer").innerText = currentWord.meaning;
}

function nextQuestion() {
  if (currentWord) history.push(currentWord);
  future = [];
  currentWord = pickWord();
  if (!currentWord) return;
  clearUI();
  renderQuestion();
}

function goBack() {
  if (history.length === 0) return;
  future.push(currentWord);
  currentWord = history.pop();
  clearUI();
  renderQuestion();
}

/* =====================
   UI HELPERS
===================== */
function clearUI() {
  document.getElementById("answer").innerText = "";
  document.getElementById("romaji").innerText = "";
}

/* =====================
   SETTINGS POPUP
===================== */
function openSettings() {
  document.getElementById("settings").style.display = "flex";
}

function closeSettings() {
  document.getElementById("settings").style.display = "none";
}

/* =====================
   START
===================== */
loadVocab();
