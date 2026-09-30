/* ===== Susun Suku Kata - Game Logic =====
   Uses shared: WordBank, GameTimer, Score, Effects
   Tap shuffled letter tiles in order to spell the word.
*/

const GAME_ID = 'susun-suku-kata';

let gameScore = 0;
let selectedTimeMode = 30;
let usedWords = [];
let currentWord = '';
let tiles = [];   // { id, letter, used }
let answer = [];  // array of tile ids, in the order tapped

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function pickNextWord() {
    let pool = WordBank.basic.filter(w => !usedWords.includes(w));
    if (pool.length === 0) {
        usedWords = [];
        pool = WordBank.basic;
    }
    const word = pool[Math.floor(Math.random() * pool.length)];
    usedWords.push(word);
    return word;
}

function generateQuestion() {
    currentWord = pickNextWord();

    let shuffledLetters;
    do {
        shuffledLetters = shuffleArray(currentWord.split(''));
    } while (shuffledLetters.join('') === currentWord && currentWord.length > 1);

    tiles = shuffledLetters.map((letter, i) => ({ id: i, letter, used: false }));
    answer = [];
}

function updateTimerDisplay(timeLeft) {
    const timerBox = document.getElementById('arena-timer-box');
    if (timeLeft === null) {
        timerBox.classList.add('hidden');
        return;
    }
    timerBox.classList.remove('hidden');
    document.getElementById('arena-timer').innerText = timeLeft;
}

function startGameMode(modeSeconds) {
    selectedTimeMode = modeSeconds;
    document.getElementById('game-modal').classList.remove('flex');
    document.getElementById('game-modal').classList.add('hidden');

    gameScore = 0;
    usedWords = [];
    document.getElementById('arena-score').innerText = gameScore;

    generateQuestion();
    GameTimer.start(modeSeconds, updateTimerDisplay, endGameSession);
    renderQuestion();
}

function renderQuestion(shakeAnswer = false) {
    const content = document.getElementById('game-content');

    const answerSlots = currentWord.split('').map((_, i) => {
        const tileId = answer[i];
        const letter = tileId !== undefined ? tiles.find(t => t.id === tileId).letter : '';
        return `<div class="w-10 h-12 md:w-12 md:h-14 rounded-lg border-2 border-sky-300 bg-sky-50 flex items-center justify-center text-xl md:text-2xl font-bold text-sky-700">${letter}</div>`;
    }).join('');

    const tileButtons = tiles.map(t => `
        <button
            onclick="tapTile(${t.id})"
            ${t.used ? 'disabled' : ''}
            class="w-12 h-12 md:w-14 md:h-14 rounded-xl text-xl md:text-2xl font-bold shadow-md transition
                ${t.used
                    ? 'bg-slate-100 text-slate-300 cursor-default'
                    : 'bg-sky-500 hover:bg-sky-600 text-white glossy-btn shadow-[0_4px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-1'}"
        >${t.letter}</button>
    `).join('');

    content.innerHTML = `
        <span class="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full uppercase">Susun Suku Kata</span>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mt-4 mb-4">Susun Huruf Jadi Perkataan</h3>

        <div id="answer-bar" class="flex justify-center gap-2 mb-6 flex-wrap ${shakeAnswer ? 'animate-shake' : ''}">
            ${answerSlots}
        </div>

        <div class="flex justify-center gap-2 flex-wrap mb-6">
            ${tileButtons}
        </div>

        <div class="flex justify-center gap-3">
            <button onclick="undoTile()" class="bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-xl font-bold text-sm transition">
                <i class="fa-solid fa-delete-left"></i> Padam
            </button>
            <button onclick="resetTiles()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition">
                <i class="fa-solid fa-rotate-left"></i> Set Semula
            </button>
        </div>
    `;
}

function tapTile(id) {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.used) return;

    tile.used = true;
    answer.push(id);
    renderQuestion();

    if (answer.length === tiles.length) {
        checkAnswer();
    }
}

function undoTile() {
    if (answer.length === 0) return;
    const lastId = answer.pop();
    tiles.find(t => t.id === lastId).used = false;
    renderQuestion();
}

function resetTiles() {
    answer = [];
    tiles.forEach(t => t.used = false);
    renderQuestion();
}

function checkAnswer() {
    const assembled = answer.map(id => tiles.find(t => t.id === id).letter).join('');

    if (assembled === currentWord) {
        gameScore += 10;
        document.getElementById('arena-score').innerText = gameScore;
        Effects.correct();
        setTimeout(() => {
            generateQuestion();
            renderQuestion();
        }, 600);
    } else {
        Effects.wrong();
        setTimeout(() => {
            resetTiles();
        }, 500);
        renderQuestion(true);
    }
}

function endGameSession() {
    GameTimer.stop();

    Score.save(GAME_ID, gameScore, selectedTimeMode);

    const content = document.getElementById('game-content');
    content.innerHTML = `
        <div class="py-8">
            <div class="text-6xl mb-4">🏆</div>
            <h3 class="text-3xl font-bold text-slate-800 mb-2">Tahniah! Permainan Tamat</h3>
            <p class="text-slate-600 text-lg mb-6">Skor berjaya dikumpul: <span class="text-amber-500 font-bold text-2xl">${gameScore}</span></p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button onclick="startGameMode(selectedTimeMode)" class="glossy-btn bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition">Main Semula</button>
                <a href="../../score.html" class="bg-amber-200 hover:bg-amber-300 text-amber-900 px-6 py-3 rounded-2xl font-bold transition inline-block text-center">Papan Skor</a>
                <a href="../../dashboard.html" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-2xl font-bold transition inline-block text-center">Menu Utama</a>
            </div>
        </div>
    `;
}

// Auto-start if the dashboard already picked a time mode before redirecting here.
window.addEventListener('DOMContentLoaded', () => {
    const preselectedMode = sessionStorage.getItem('kc_pending_mode');
    if (preselectedMode !== null) {
        sessionStorage.removeItem('kc_pending_mode');
        startGameMode(Number(preselectedMode));
    }
});
