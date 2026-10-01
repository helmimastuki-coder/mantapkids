/* ===== Padan Gambar & Perkataan - Game Logic =====
   Uses shared: ImageBank, GameTimer, Score, Effects
   Memory-match mechanic: flip two cards, match a picture with its word.
*/

const GAME_ID = 'padan-gambar';

let gameScore = 0;
let selectedTimeMode = 30;
let boardCards = [];
let flippedIndices = [];
let lockBoard = false;

const PAIRS_PER_ROUND = 6; // 6 pairs = 12 cards

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateRound() {
    const pickedPairs = shuffleArray(ImageBank.pairs).slice(0, PAIRS_PER_ROUND);

    let cards = [];
    pickedPairs.forEach(pair => {
        cards.push({ word: pair.word, content: pair.emoji, isImage: true, flipped: false, matched: false });
        cards.push({ word: pair.word, content: pair.word, isImage: false, flipped: false, matched: false });
    });

    boardCards = shuffleArray(cards).map((c, i) => ({ ...c, id: i }));
    flippedIndices = [];
    lockBoard = false;
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
    document.getElementById('arena-score').innerText = gameScore;

    generateRound();
    GameTimer.start(modeSeconds, updateTimerDisplay, endGameSession);
    renderBoard();
}

function renderBoard() {
    const content = document.getElementById('game-content');
    content.innerHTML = `
        <span class="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full uppercase">Padan Gambar</span>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mt-4 mb-4">Cari Pasangan Gambar & Perkataan</h3>
        <div id="card-grid" class="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-md mx-auto">
            ${boardCards.map(card => renderCard(card)).join('')}
        </div>
    `;
}

function renderCard(card) {
    const isShown = card.flipped || card.matched;
    const sizeClasses = card.isImage ? "text-2xl md:text-3xl" : "text-xs md:text-sm";
    const baseClasses = `aspect-square rounded-xl flex items-center justify-center font-bold transition-all duration-200 shadow-md p-1 text-center ${sizeClasses}`;

    if (card.matched) {
        return `<div class="${baseClasses} bg-emerald-200 text-emerald-700 border-2 border-emerald-400">${card.content}</div>`;
    }
    if (isShown) {
        return `<button onclick="flipCard(${card.id})" class="${baseClasses} bg-amber-100 text-amber-700 border-2 border-amber-400">${card.content}</button>`;
    }
    return `<button onclick="flipCard(${card.id})" class="${baseClasses} bg-sky-500 hover:bg-sky-600 text-white glossy-btn shadow-[0_4px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-1">?</button>`;
}

function flipCard(id) {
    if (lockBoard) return;
    const card = boardCards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    card.flipped = true;
    flippedIndices.push(id);
    renderBoard();

    if (flippedIndices.length === 2) {
        lockBoard = true;
        const [firstId, secondId] = flippedIndices;
        const first = boardCards.find(c => c.id === firstId);
        const second = boardCards.find(c => c.id === secondId);

        // Match = same underlying word, but one image + one text (not two of the same type)
        const isMatch = first.word === second.word && first.isImage !== second.isImage;

        if (isMatch) {
            first.matched = true;
            second.matched = true;
            gameScore += 10;
            document.getElementById('arena-score').innerText = gameScore;
            Effects.correct();
            flippedIndices = [];
            lockBoard = false;
            renderBoard();

            if (boardCards.every(c => c.matched)) {
                setTimeout(() => {
                    generateRound();
                    renderBoard();
                }, 500);
            }
        } else {
            Effects.wrong();
            setTimeout(() => {
                first.flipped = false;
                second.flipped = false;
                flippedIndices = [];
                lockBoard = false;
                renderBoard();
            }, 700);
        }
    }
}

function endGameSession() {
    GameTimer.stop();
    lockBoard = true;

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
    const preselectedMode = sessionStorage.getItem('mk_pending_mode');
    if (preselectedMode !== null) {
        sessionStorage.removeItem('mk_pending_mode');
        startGameMode(Number(preselectedMode));
    }
});
