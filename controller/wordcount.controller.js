document.addEventListener('DOMContentLoaded', function () {
    const model = new WordCountModel();
    const view = new WordCountView();

    // Theme functions
    function getStoredTheme() {
        return localStorage.getItem('theme') || 'auto';
    }
    function setTheme(mode) {
        let applied = mode;
        if (mode === 'auto') {
            applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        view.htmlEl.setAttribute('data-bs-theme', applied);
        const icons = {
            light: 'bi-sun-fill',
            dark: 'bi-moon-stars-fill',
            auto: 'bi-circle-half'
        };
        view.themeIcon.className = 'bi ' + icons[mode];
        localStorage.setItem('theme', mode);
    }
    view.themeToggleBtn.addEventListener('click', function () {
        const current = getStoredTheme();
        const next = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
        setTheme(next);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (getStoredTheme() === 'auto') setTheme('auto');
    });

    // Stats update
    function updateAll() {
        model.setText(view.textInput.value);
        view.updateStats(model.stats);
        [
            view.charCount, view.charNoSpaceCount, view.wordCount, view.lineCount,
            view.sentenceCount, view.paragraphCount, view.uniqueWordCount,
            view.avgWordLength, view.readTime, view.readTimeSec
        ].forEach(el => view.animate(el));
    }

    // Auto-save
    let autoSaveTimeoutId = null;
    let lastSavedText = '';
    let pendingChanges = false;
    function scheduleAutoSave() {
        if (autoSaveTimeoutId) clearTimeout(autoSaveTimeoutId);
        if (model.autoSaveEnabled) {
            view.updateSaveStatus('saving', null, 0);
            autoSaveTimeoutId = setTimeout(saveText, parseInt(view.autoSaveInterval.value));
        }
    }
    function saveText() {
        if (!pendingChanges) return;
        try {
            localStorage.setItem('savedText', view.textInput.value);
            lastSavedText = view.textInput.value;
            pendingChanges = false;
            view.updateSaveStatus('', null);
        } catch (error) {
            console.error('Error saving text:', error);
            view.updateSaveStatus('error', null, 5000);
        }
    }
    function loadText() {
        try {
            const saved = localStorage.getItem('savedText');
            if (saved) {
                view.textInput.value = saved;
                lastSavedText = saved;
                updateAll();
            }
            const savedInterval = localStorage.getItem('autoSaveInterval');
            if (savedInterval) view.autoSaveInterval.value = savedInterval;
            const savedAuto = localStorage.getItem('autoSaveEnabled');
            if (savedAuto !== null) {
                model.autoSaveEnabled = savedAuto === 'true';
                view.autoSaveToggle.checked = model.autoSaveEnabled;
            }
        } catch (error) {
            console.error('Error loading text:', error);
            view.updateSaveStatus('error', 'ไม่สามารถโหลดข้อความ', 5000);
        }
    }

    // Button actions
    function clearText() {
        if (!view.textInput.value) return;
        if (confirm('ล้างข้อความทั้งหมด?')) {
            view.textInput.value = '';
            try {
                localStorage.removeItem('savedText');
                lastSavedText = '';
                updateAll();
                view.textInput.focus();
                view.updateSaveStatus('', 'ล้างข้อความเรียบร้อย');
            } catch (error) {
                console.error('Error clearing text:', error);
                view.updateSaveStatus('error', 'ไม่สามารถล้างข้อความ', 5000);
            }
        }
    }
    function copyText() {
        if (!view.textInput.value) return;
        navigator.clipboard.writeText(view.textInput.value)
            .then(() => showTempMsg(view.copyBtn, '<i class="bi bi-check-lg me-1"></i>คัดลอกแล้ว!', 'btn-success'))
            .catch(() => showTempMsg(view.copyBtn, '<i class="bi bi-x-lg me-1"></i>คัดลอกล้มเหลว!', 'btn-danger'));
    }
    function showTempMsg(btn, html, type) {
        const orig = btn.innerHTML, classes = [...btn.classList];
        btn.innerHTML = html;
        btn.className = `btn ${type} action-btn`;
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.className = classes.join(' ');
        }, 2000);
    }
    function shareText() {
        const txt = view.textInput.value;
        if (!txt) {
            alert('ไม่มีข้อความให้แชร์');
            return;
        }
        if (navigator.share) {
            navigator.share({
                title: 'ข้อความจาก Word Counter',
                text: txt
            }).catch(err => {
                console.error('Error sharing:', err);
                alert('เกิดข้อผิดพลาดในการแชร์');
            });
        } else {
            alert('เบราว์เซอร์ไม่รองรับการแชร์');
        }
    }
    function printText() {
        const txt = view.textInput.value;
        if (!txt) {
            alert('ไม่มีข้อความสำหรับพิมพ์');
            return;
        }
        try {
            const w = window.open();
            w.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Word Counter - Print</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        pre { white-space: pre-wrap; font-family: inherit; line-height: 1.5; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .metadata { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
                        .content { border-top: 1px solid #ddd; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Word Counter</h1>
                    </div>
                    <div class="metadata">
                        <p><strong>ตัวอักษร:</strong> ${view.charCount.textContent} | <strong>คำ:</strong> ${view.wordCount.textContent} | <strong>บรรทัด:</strong> ${view.lineCount.textContent}</p>
                        <p><strong>วันที่พิมพ์:</strong> ${new Date().toLocaleString('th-TH')}</p>
                    </div>
                    <div class="content">
                        <pre>${txt}</pre>
                    </div>
                </body>
                </html>
            `);
            w.document.close();
            w.print();
        } catch (error) {
            console.error('Error printing:', error);
            alert('เกิดข้อผิดพลาดในการพิมพ์');
        }
    }

    // Event listeners
    view.textInput.addEventListener('input', function () {
        updateAll();
        pendingChanges = view.textInput.value !== lastSavedText;
        if (pendingChanges && model.autoSaveEnabled) {
            scheduleAutoSave();
        }
    });
    view.clearBtn.addEventListener('click', clearText);
    view.copyBtn.addEventListener('click', copyText);
    view.shareBtn.addEventListener('click', shareText);
    view.printBtn.addEventListener('click', printText);
    view.autoSaveToggle.addEventListener('change', function () {
        model.autoSaveEnabled = this.checked;
        localStorage.setItem('autoSaveEnabled', model.autoSaveEnabled);
        if (model.autoSaveEnabled && pendingChanges) scheduleAutoSave();
    });
    view.autoSaveInterval.addEventListener('change', function () {
        localStorage.setItem('autoSaveInterval', this.value);
        if (model.autoSaveEnabled && pendingChanges) scheduleAutoSave();
    });
    view.manualSaveBtn.addEventListener('click', function () {
        view.updateSaveStatus('saving', null, 0);
        setTimeout(saveText, 300);
    });

    // Init
    setTheme(getStoredTheme());
    loadText();
    updateAll();
});