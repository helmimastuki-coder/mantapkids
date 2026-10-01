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
    const timerText = document.getElementById('arena-timer');
    const progressBar = document.getElementById('timer-progress-bar');

    if (timeLeft === null) {
        timerBox.classList.add('hidden');
        return;
    }
    timerBox.classList.remove('hidden');
    timerText.innerText = timeLeft;

    const totalDuration = selectedTimeMode || 1; // guard against divide-by-zero
    const percent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }

    const isUrgent = timeLeft <= 5;
    timerText.classList.toggle('timer-urgent', isUrgent);
    if (progressBar) {
        progressBar.classList.toggle('bg-sky-500', !isUrgent);
        progressBar.classList.toggle('bg-rose-500', isUrgent);
    }
}

function startGameMode(modeSeconds) {
    selectedTimeMode = modeSeconds;
    document.getElementById('game-modal').classList.remove('flex');
    document.getElementById('game-modal').classList.add('hidden');

    gameScore = 0;
    currentQuestionIndex = 0;
    answerLocked = false;
    Effects.resetStreak();
    document.getElementById('arena-score').innerText = gameScore;

    gameDataList = generateGameData(gameSettings.questionsPerRound);

    GameTimer.start(modeSeconds, updateTimerDisplay, endGameSession);

    renderQuestion();
    Effects.shakeScreen(); // quick "ready, go!" shake as the round kicks off
}

function renderQuestion() {
    if (currentQuestionIndex >= gameDataList.length) {
        currentQuestionIndex = 0;
        gameDataList = generateGameData(gameSettings.questionsPerRound);
    }

    const q = gameDataList[currentQuestionIndex];
    const content = document.getElementById('game-content');
    answerLocked = false;

    const letters = q.originalWord.split('');
    const letterBoxesHtml = letters.map((letter, idx) => {
        if (idx === q.blankIndex) {
            return `<span id="blank-slot" class="letter-box blank-box"></span>`;
        }
        return `<span class="letter-box">${letter}</span>`;
    }).join('');

    content.innerHTML = `
        <span class="text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full uppercase">Soalan ${currentQuestionIndex + 1}</span>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mt-4 mb-2">Cari Huruf yang Hilang</h3>
        <div class="word-pop-in flex justify-center items-center flex-wrap text-4xl md:text-5xl font-bold tracking-wide text-amber-600 my-6 bg-amber-50 py-6 rounded-2xl border-2 border-amber-200 w-full">${letterBoxesHtml}</div>
        <p class="text-slate-500 mb-4 text-sm">Pilih huruf yang tepat di bawah:</p>
        <div id="options-grid" class="grid grid-cols-3 gap-4">
            ${q.options.map((opt, i) => `
                <button onclick="checkAnswer('${opt}', '${q.missing}', this)" style="animation-delay: ${i * 80}ms" class="tile-pop-in glossy-btn bg-sky-500 hover:bg-sky-600 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-1 transition">${opt}</button>
            `).join('')}
        </div>
    `;
}

function checkAnswer(selected, correct, btnEl) {
    if (answerLocked) return;
    answerLocked = true;

    const isCorrect = String(selected) === String(correct);

    // Lock the whole grid so a quick second tap can't interrupt the animation
    const grid = document.getElementById('options-grid');
    if (grid) grid.style.pointerEvents = 'none';

    const blankSlot = document.getElementById('blank-slot');

    if (isCorrect) {
        gameScore += 10;
        document.getElementById('arena-score').innerText = gameScore;
        if (btnEl) btnEl.classList.add('tile-pop-correct');
        if (blankSlot) {
            blankSlot.textContent = correct;
            blankSlot.classList.add('blank-correct');
        }
        Effects.correct();
    } else {
        if (btnEl) btnEl.classList.add('tile-shake-wrong');
        if (blankSlot) {
            blankSlot.textContent = selected; // show what they picked, so it's clear why it's wrong
            blankSlot.classList.add('blank-wrong');
        }
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

    // Lock input immediately so a last-second tap can't bleed into the results screen
    const grid = document.getElementById('options-grid');
    if (grid) grid.style.pointerEvents = 'none';

    Score.save(GAME_ID, gameScore, selectedTimeMode);

    const content = document.getElementById('game-content');

    // Brief transitional state — gives a trailing tap nothing to accidentally hit,
    // and gives the round a small "wrapping up" beat before the reveal.
    content.innerHTML = `
        <div class="py-16 flex flex-col items-center justify-center text-slate-400">
            <div class="text-5xl mb-3 animate-pulse">⏳</div>
            <p class="font-bold text-sm">Mengira skor...</p>
        </div>
    `;

    setTimeout(() => {
        Effects.celebrate();
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
    }, 1000);
}

// If the dashboard already picked a time mode before redirecting here,
// auto-start instead of forcing the player through the modal again.
window.addEventListener('DOMContentLoaded', () => {
    const preselectedMode = sessionStorage.getItem('mk_pending_mode');
    if (preselectedMode !== null) {
        sessionStorage.removeItem('mk_pending_mode');
        startGameMode(Number(preselectedMode));
    }
});
