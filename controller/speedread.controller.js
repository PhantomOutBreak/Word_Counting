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

    // Theme System
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
        view.toggleButtonsState(true, model.words.length > 0);
        scheduleNextWord();
    }
    function pauseReading() {
        clearTimeout(model.timerId);
        model.isPlaying = false;
        view.toggleButtonsState(false, model.words.length > 0);
    }
    function resetReading() {
        pauseReading();
        model.resetPosition();
        view.updateProgress(0, model.words.length);
        view.resetDisplay();
        view.toggleButtonsState(false, model.words.length > 0);
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

            // --- Save WPM history ---
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
    view.renderWpmHistory(JSON.parse(localStorage.getItem('wpm-history') || '[]'));

    // --- แจ้งเตือนการบันทึกอัตโนมัติแบบ wordcount ---
    function showSaveToast(message = 'บันทึกอัตโนมัติแล้ว') {
        let oldToast = document.getElementById('save-toast');
        if (oldToast) oldToast.remove();
        const toast = document.createElement('div');
        toast.id = 'save-toast';
        toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-700 text-white px-5 py-2 rounded-xl shadow-lg z-[9999] text-sm font-medium';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 1800);
    }
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    let lastSavedText = localStorage.getItem('speedread-text') || '';
    const debouncedAutoSave = debounce(function () {
        const currentText = textInput.value;
        if (currentText !== lastSavedText) {
            localStorage.setItem('speedread-text', currentText);
            lastSavedText = currentText;
            showSaveToast();
        }
    }, 500);

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
        view.toggleButtonsState(false, model.words.length > 0);
        debouncedAutoSave();
    });

    // Initialize
    const savedText = localStorage.getItem('speedread-text');
    if (savedText) {
        textInput.value = savedText;
    }
    model.processText(textInput.value);
    view.updateWordCount(model.words.length);
    view.setSpeedValue(speedSlider.value);
});