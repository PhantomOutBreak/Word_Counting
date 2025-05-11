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

    // Theme System
    function getStoredTheme() {
        return localStorage.getItem('theme') || 'auto';
    }
    function setTheme(mode) {
        let applied = mode;
        if (mode === 'auto') {
            applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
        if (model.currentWordIndex >= model.words.length) resetReading();
        if (model.words.length === 0) {
            model.processText(textInput.value);
            view.updateWordCount(model.words.length);
        }
        if (model.words.length === 0) return;
        model.isPlaying = true;
        const speed = parseInt(speedSlider.value);
        const interval = 60000 / speed;
        model.timerId = setInterval(function () {
            if (model.currentWordIndex < model.words.length) {
                view.displayWord(model.words[model.currentWordIndex]);
                view.updateProgress(model.currentWordIndex, model.words.length);
                model.currentWordIndex++;
            } else {
                pauseReading();
                pauseTimer();
                view.showFinish();
            }
        }, interval);
    }
    function pauseReading() {
        clearInterval(model.timerId);
        model.isPlaying = false;
    }
    function resetReading() {
        pauseReading();
        model.currentWordIndex = 0;
        view.updateProgress(0, model.words.length);
        view.resetDisplay();
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
            view.setNavbarReading(true);
        }
    });
    pauseButton.addEventListener('click', function () {
        if (model.isPlaying) {
            pauseReading();
            pauseTimer();
            view.setNavbarReading(false);
        }
    });
    resetButton.addEventListener('click', function () {
        resetReading();
        resetTimer();
        view.setNavbarReading(false);
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