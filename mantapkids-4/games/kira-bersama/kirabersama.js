/* ===== Kira Bersama - Game Logic =====
   Uses shared: EmojiBank, GameTimer, Score, Effects
   Shows a cluster of objects, kid taps the number that matches the count.
*/

const GAME_ID = 'kira-bersama';

let gameScore = 0;
let selectedTimeMode = 30;
let currentCount = 0;
let answerLocked = false;

const MIN_COUNT = 2;
const MAX_COUNT = 10;

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateOptions(correctCount) {
    const options = new Set([correctCount]);
    while (options.size < 3) {
        const offset = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const candidate = correctCount + offset;
        if (candidate >= MIN_COUNT && candidate <= MAX_COUNT + 2 && candidate !== correctCount) {
            options.add(candidate);
        }
    }
    return shuffleArray([...options]);
}

function generateQuestion() {
    currentCount = Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1)) + MIN_COUNT;
    const emoji = EmojiBank.objects[Math.floor(Math.random() * EmojiBank.objects.length)];
    return {
        emoji,
        count: currentCount,
        options: generateOptions(currentCount)
    };
}

let currentQuestion = null;

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
    answerLocked = false;
    document.getElementById('arena-score').innerText = gameScore;

    GameTimer.start(modeSeconds, updateTimerDisplay, endGameSession);
    renderQuestion();
}

function renderQuestion() {
    currentQuestion = generateQuestion();
    answerLocked = false;

    const content = document.getElementById('game-content');
    content.innerHTML = `
        <span class="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full uppercase">Kira Bersama</span>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mt-4 mb-4">Berapakah Bilangannya?</h3>
        <div class="flex flex-wrap justify-center gap-3 md:gap-4 text-4xl md:text-5xl my-6 bg-amber-50 py-6 px-4 rounded-2xl border-2 border-amber-200 w-full min-h-[120px] items-center">
            ${Array(currentQuestion.count).fill(currentQuestion.emoji).map(e => `<span>${e}</span>`).join('')}
        </div>
        <p class="text-slate-500 mb-4 text-sm">Pilih jawapan yang betul:</p>
        <div class="grid grid-cols-3 gap-4">
            ${currentQuestion.options.map(opt => `
                <button onclick="checkAnswer(${opt})" class="glossy-btn bg-sky-500 hover:bg-sky-600 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-1 transition">${opt}</button>
            `).join('')}
        </div>
    `;
}

function checkAnswer(selected) {
    if (answerLocked) return;
    answerLocked = true;

    if (selected === currentQuestion.count) {
        gameScore += 10;
        document.getElementById('arena-score').innerText = gameScore;
        Effects.correct();
    } else {
        Effects.wrong();
    }

    setTimeout(() => {
        renderQuestion();
    }, 500);
}

function endGameSession() {
    GameTimer.stop();
    answerLocked = true;

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
