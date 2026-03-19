const STORAGE_KEY = "daily_wordle_data";
const STATS_KEY = "daily_wordle_stats";

const board = document.getElementById("board");
const messageEl = document.getElementById("message");
const gamesPlayedEl = document.getElementById("gamesPlayed");
const gamesWonEl = document.getElementById("gamesWon");
const winPercentEl = document.getElementById("winPercent");

const rows = 6;
const cols = 5;

let currentRow = 0;
let currentCol = 0;
let guesses = Array.from({ length: rows }, () => Array(cols).fill(""));
let gameOver = false;

if (!Array.isArray(ANSWER_WORDS) || !Array.isArray(VALID_WORDS)) {
  throw new Error("Word lists not loaded.");
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getWordOfTheDay() {
  const today = getTodayString();
  let hash = 0;

  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % ANSWER_WORDS.length;
  return ANSWER_WORDS[index];
}

const targetWord = getWordOfTheDay();

function createBoard() {
  board.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement("div");
    rowEl.classList.add("row");

    for (let c = 0; c < cols; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.id = `tile-${r}-${c}`;
      rowEl.appendChild(tile);
    }

    board.appendChild(rowEl);
  }
}

function createKeyboard() {
  const row1 = "QWERTYUIOP".split("");
  const row2 = "ASDFGHJKL".split("");
  const row3 = ["ENTER", ..."ZXCVBNM".split(""), "BACK"];

  fillKeyboardRow("row1", row1);
  fillKeyboardRow("row2", row2);
  fillKeyboardRow("row3", row3);
}

function fillKeyboardRow(rowId, keys) {
  const rowEl = document.getElementById(rowId);
  rowEl.innerHTML = "";

  keys.forEach(key => {
    const btn = document.createElement("button");
    btn.textContent = key;
    btn.classList.add("key");

    if (key === "ENTER" || key === "BACK") {
      btn.classList.add("large");
    }

    btn.addEventListener("click", () => handleKey(key));
    rowEl.appendChild(btn);
  });
}

function handleKey(key) {
  if (gameOver) return;

  if (/^[A-Z]$/.test(key)) {
    addLetter(key);
  } else if (key === "BACK") {
    deleteLetter();
  } else if (key === "ENTER") {
    submitGuess();
  }
}

function addLetter(letter) {
  if (currentCol < cols && currentRow < rows) {
    guesses[currentRow][currentCol] = letter.toLowerCase();
    updateTile(currentRow, currentCol, letter);
    currentCol++;
    saveGame();
  }
}

function deleteLetter() {
  if (currentCol > 0) {
    currentCol--;
    guesses[currentRow][currentCol] = "";
    updateTile(currentRow, currentCol, "");
    saveGame();
  }
}

function updateTile(row, col, letter) {
  const tile = document.getElementById(`tile-${row}-${col}`);
  tile.textContent = letter;
  tile.classList.toggle("filled", letter !== "");
}

function submitGuess() {
  if (currentCol < cols) {
    showMessage("Not enough letters");
    return;
  }

  const guess = guesses[currentRow].join("");

  if (!VALID_WORDS.includes(guess)) {
    showMessage("Not in word list");
    return;
  }

  colorGuess(currentRow, guess);

  if (guess === targetWord) {
    gameOver = true;
    showMessage("You got it! 🎉");
    updateStats(true);
    saveGame();
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow === rows) {
    gameOver = true;
    showMessage(`Game over! Word was "${targetWord.toUpperCase()}"`);
    updateStats(false);
  }

  saveGame();
}

function getStatuses(guess) {
  const letterCount = {};
  for (const char of targetWord) {
    letterCount[char] = (letterCount[char] || 0) + 1;
  }

  const result = Array(cols).fill("absent");

  for (let i = 0; i < cols; i++) {
    if (guess[i] === targetWord[i]) {
      result[i] = "correct";
      letterCount[guess[i]]--;
    }
  }

  for (let i = 0; i < cols; i++) {
    if (result[i] === "correct") continue;

    if (letterCount[guess[i]] > 0) {
      result[i] = "present";
      letterCount[guess[i]]--;
    }
  }

  return result;
}

function colorGuess(row, guess) {
  const result = getStatuses(guess);

  for (let i = 0; i < cols; i++) {
    const tile = document.getElementById(`tile-${row}-${i}`);
    tile.classList.add(result[i]);
    updateKeyboardColor(guess[i].toUpperCase(), result[i]);
  }
}

function updateKeyboardColor(letter, status) {
  const keys = document.querySelectorAll(".key");

  keys.forEach(key => {
    if (key.textContent !== letter) return;

    if (key.classList.contains("correct")) return;
    if (key.classList.contains("present") && status === "absent") return;
    if (key.classList.contains("present") && status === "present") return;

    key.classList.remove("correct", "present", "absent");
    key.classList.add(status);
  });
}

function showMessage(msg) {
  messageEl.textContent = msg;
}

function loadStats() {
  const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {
    played: 0,
    won: 0
  };

  const winPercent = stats.played === 0
    ? 0
    : Math.round((stats.won / stats.played) * 100);

  gamesPlayedEl.textContent = stats.played;
  gamesWonEl.textContent = stats.won;
  winPercentEl.textContent = `${winPercent}%`;
}

function updateStats(won) {
  const today = getTodayString();
  const gameData = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (gameData && gameData.date === today && gameData.counted) {
    return;
  }

  const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {
    played: 0,
    won: 0
  };

  stats.played++;
  if (won) stats.won++;

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));

  const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  savedGame.counted = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGame));

  loadStats();
}

function saveGame() {
  const previous = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  const gameData = {
    date: getTodayString(),
    guesses,
    currentRow,
    currentCol,
    gameOver,
    counted: previous.counted || false
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

function loadGame() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const today = getTodayString();

  if (!saved || saved.date !== today) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  guesses = saved.guesses;
  currentRow = saved.currentRow;
  currentCol = saved.currentCol;
  gameOver = saved.gameOver;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const letter = guesses[r][c];
      if (letter) {
        updateTile(r, c, letter.toUpperCase());
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    const guess = guesses[r].join("");
    if (guess.length === 5 && !guess.includes("")) {
      colorGuess(r, guess);
    }
  }

  const won = guesses.some(row => row.join("") === targetWord);

  if (gameOver && won) {
    showMessage("You already solved today's Wordle 🎉");
  } else if (gameOver) {
    showMessage(`You already finished today. Word was "${targetWord.toUpperCase()}"`);
  }
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toUpperCase();

  if (key === "BACKSPACE") {
    handleKey("BACK");
  } else if (key === "ENTER") {
    handleKey("ENTER");
  } else if (/^[A-Z]$/.test(key)) {
    handleKey(key);
  }
});

createBoard();
createKeyboard();
loadStats();
loadGame();
