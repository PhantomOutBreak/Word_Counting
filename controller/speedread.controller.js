document.addEventListener('DOMContentLoaded', function () {
    const model = new SpeedReadModel();
    const view = new SpeedReadView();

    // UI Elements
    const startButton = document.getElementById('start');
    const pauseButton = document.getElementById('pause');
    const resetButton = document.getElementById('reset');
    const speedSlider = document.getElementById('speed');
    const textInput = document.getElementById('text-input');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Theme System (เหมือนเดิม)
    function getStoredTheme() {
        return localStorage.getItem('theme') || 'auto';
    }
    function setTheme(mode) {
        let applied = mode;
        if (mode === 'auto') {
            applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (applied === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        htmlEl.setAttribute('data-bs-theme', applied);
        const icons = {
            light: '<i class="fas fa-sun text-white"></i>',
            dark: '<i class="fas fa-moon text-white"></i>',
            auto: '<i class="fas fa-circle-half-stroke text-white"></i>'
        };
        themeToggle.innerHTML = icons[mode];
        localStorage.setItem('theme', mode);
    }
    themeToggle.addEventListener('click', function () {
        const current = getStoredTheme();
        let next;
        if (current === 'auto') next = 'light';
        else if (current === 'light') next = 'dark';
        else next = 'auto';
        setTheme(next);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (getStoredTheme() === 'auto') setTheme('auto');
    });
    setTheme(getStoredTheme());

    // Reading Functions
    function startReading() {
        if (model.words.length === 0) {
            model.processText(textInput.value);
            view.updateWordCount(model.words.length);
        }
        if (model.words.length === 0) return;
        model.isPlaying = true;
        scheduleNextWord();
    }
    function pauseReading() {
        clearTimeout(model.timerId);
        model.isPlaying = false;
    }
    function resetReading() {
        pauseReading();
        model.resetPosition();
        view.updateProgress(0, model.words.length);
        view.resetDisplay();
    }
    function scheduleNextWord() {
        if (!model.isPlaying) return;

        const word = model.showNextWord();
        if (word !== "เสร็จสิ้น") {
            view.displayWord(word);
            view.updateProgress(model.currentWordIndex, model.words.length);

            const delay = 60000 / speedSlider.value;
            model.timerId = setTimeout(scheduleNextWord, delay);
        } else {
            pauseReading();
            pauseTimer();
            view.showFinish();

            // --- เพิ่มส่วนนี้ ---
            const totalWords = model.words.length;
            const minutes = model.elapsedTime ? (model.elapsedTime / 60000) : 1;
            const wpm = Math.round(totalWords / minutes);
            saveWpmHistory(wpm);
        }
    }

    // Timer Functions
    function startTimer() {
        view.showTimer();
        if (!model.startTime) model.startTime = Date.now() - model.elapsedTime;
        model.timerInterval = setInterval(updateTimer, 1000);
    }
    function pauseTimer() {
        clearInterval(model.timerInterval);
        model.elapsedTime = Date.now() - model.startTime;
    }
    function resetTimer() {
        clearInterval(model.timerInterval);
        view.hideTimer();
        model.startTime = null;
        model.elapsedTime = 0;
    }
    function updateTimer() {
        model.elapsedTime = Date.now() - model.startTime;
        const minutes = Math.floor(model.elapsedTime / 60000);
        const seconds = Math.floor((model.elapsedTime % 60000) / 1000);
        view.updateTimer(minutes, seconds);
    }

    // --- ระบบประวัติ WPM ---
    function saveWpmHistory(wpm) {
        let history = JSON.parse(localStorage.getItem('wpm-history') || '[]');
        history.unshift(wpm);
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem('wpm-history', JSON.stringify(history));
        view.renderWpmHistory(history);
    }

    function clearWpmHistory() {
        localStorage.removeItem('wpm-history');
        view.renderWpmHistory([]);
    }

    document.getElementById('clear-history').addEventListener('click', clearWpmHistory);

    // เรียกตอนโหลดหน้า
    view.renderWpmHistory(JSON.parse(localStorage.getItem('wpm-history') || '[]'));

    // เรียก saveWpmHistory(wpm) หลังอ่านจบ (ใน view.showFinish หรือ completeReadingSession)

    // Event Listeners
    speedSlider.addEventListener('input', function () {
        view.setSpeedValue(speedSlider.value);
        if (model.isPlaying) {
            pauseReading();
            startReading();
        }
    });
    startButton.addEventListener('click', function () {
        if (!model.isPlaying) {
            startReading();
            startTimer();
            if (typeof view.setNavbarReading === "function") view.setNavbarReading(true);
        }
    });
    pauseButton.addEventListener('click', function () {
        if (model.isPlaying) {
            pauseReading();
            pauseTimer();
            if (typeof view.setNavbarReading === "function") view.setNavbarReading(false);
        }
    });
    resetButton.addEventListener('click', function () {
        resetReading();
        resetTimer();
        if (typeof view.setNavbarReading === "function") view.setNavbarReading(false);
    });
    textInput.addEventListener('input', function () {
        resetReading();
        resetTimer();
        model.processText(textInput.value);
        view.updateWordCount(model.words.length);
    });

    // Initialize
    model.processText(textInput.value);
    view.updateWordCount(model.words.length);
    view.setSpeedValue(speedSlider.value);
});