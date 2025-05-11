class WordCountModel {
    constructor() {
        this.text = '';
        this.stats = this.calculateStats('');
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 2000;
    }

    setText(text) {
        this.text = text;
        this.stats = this.calculateStats(text);
    }

    calculateStats(text) {
        const chars = text.length;
        const noSpaces = text.replace(/\s/g, '').length;
        const wordsArr = text.trim().split(/\s+/).filter(Boolean);
        const words = text.trim() ? wordsArr.length : 0;
        const lines = text ? text.split(/\r?\n/).length : 0;
        const sentences = text ? (text.match(/[\.!?]+/g) || []).length : 0;
        const paras = text.trim() ? text.split(/(?:\r?\n){2,}/).filter(Boolean).length : 0;
        const unique = new Set(wordsArr.map(w => w.toLowerCase()));
        const avgLen = wordsArr.length ? (wordsArr.reduce((sum, w) => sum + w.length, 0) / wordsArr.length) : 0;
        const minutes = words / 200;
        const seconds = minutes * 60;
        return {
            chars,
            noSpaces,
            words,
            lines,
            sentences,
            paras,
            unique: unique.size,
            avgLen,
            minutes,
            seconds
        };
    }
}