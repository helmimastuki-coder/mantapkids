/* ===== Isi Tempat Kosong Ya Kids - Game Logic =====
   Uses shared: WordBank, GameTimer, Score, Effects
   Everything here is specific to THIS game's question/answer mechanic.
*/

const GAME_ID = 'isi-tempat-kosong';

let gameScore = 0;
let selectedTimeMode = 30;
let currentQuestionIndex = 0;
let gameDataList = [];
let answerLocked = false;

const gameSettings = {
    randomWords: true,
    randomLetters: true,
    randomBlankPosition: true,
    questionsPerRound: 15
};

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateOptions(correctLetter) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("")
        .filter(letter => letter !== correctLetter);

    const wrongLetters = shuffleArray(alphabet).slice(0, 2);
    let options = [correctLetter, ...wrongLetters];

    if (gameSettings.randomLetters) {
        options = shuffleArray(options);
    }
    return options;
}

function createQuestion(word) {
    const letters = word.split("");
    const blankIndex = gameSettings.randomBlankPosition
        ? Math.floor(Math.random() * letters.length)
        : 0;

    const missingLetter = letters[blankIndex];
    const displayLetters = [...letters];
    displayLetters[blankIndex] = "_";

    return {
        word: displayLetters.join(" "),
        answer: missingLetter,
        options: generateOptions(missingLetter),
        originalWord: word,
        missing: missingLetter,
        blankIndex: blankIndex,
        hint: `Lengkapkan perkataan "${word}"`
    };
}

function generateGameData(numberOfQuestions = 15) {
    let words = [...WordBank.basic];
    if (gameSettings.randomWords) {
        words = shuffleArray(words);
    }
    words = words.slice(0, Math.min(numberOfQuestions, words.length));
    return words.map(word => createQuestion(word));
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
    currentQuestionIndex = 0;
    answerLocked = false;
    document.getElementById('arena-score').innerText = gameScore;

    gameDataList = generateGameData(gameSettings.questionsPerRound);

    GameTimer.start(modeSeconds, updateTimerDisplay, endGameSession);

    renderQuestion();
}

function renderQuestion() {
    if (currentQuestionIndex >= gameDataList.length) {
        currentQuestionIndex = 0;
        gameDataList = generateGameData(gameSettings.questionsPerRound);
    }

    const q = gameDataList[currentQuestionIndex];
    const content = document.getElementById('game-content');
    answerLocked = false;

    content.innerHTML = `
        <span class="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full uppercase">Soalan ${currentQuestionIndex + 1}</span>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mt-4 mb-2">Cari Huruf yang Hilang</h3>
        <div class="text-4xl md:text-5xl font-bold tracking-widest text-amber-600 my-6 bg-amber-50 py-6 rounded-2xl border-2 border-amber-200 w-full">${q.word}</div>
        <p class="text-slate-500 mb-4 text-sm">Pilih huruf yang tepat di bawah:</p>
        <div class="grid grid-cols-3 gap-4">
            ${q.options.map(opt => `
                <button onclick="checkAnswer('${opt}', '${q.missing}')" class="glossy-btn bg-sky-500 hover:bg-sky-600 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-1 transition">${opt}</button>
            `).join('')}
        </div>
    `;
}

function checkAnswer(selected, correct) {
    if (answerLocked) return;
    answerLocked = true;

    const isCorrect = String(selected) === String(correct);

    if (isCorrect) {
        gameScore += 10;
        document.getElementById('arena-score').innerText = gameScore;
        Effects.correct();
    } else {
        Effects.wrong();
    }

    currentQuestionIndex++;
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

// If the dashboard already picked a time mode before redirecting here,
// auto-start instead of forcing the player through the modal again.
window.addEventListener('DOMContentLoaded', () => {
    const preselectedMode = sessionStorage.getItem('kc_pending_mode');
    if (preselectedMode !== null) {
        sessionStorage.removeItem('kc_pending_mode');
        startGameMode(Number(preselectedMode));
    }
});
