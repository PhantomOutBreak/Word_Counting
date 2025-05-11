class SpeedReadModel {
    constructor() {
        this.words = [];
        this.currentWordIndex = 0;
        this.isPlaying = false;
        this.timerId = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
    }

    processText(text) {
        text = text.trim();
        if (text) {
            if (window.Intl && Intl.Segmenter) {
                try {
                    const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
                    this.words = Array.from(segmenter.segment(text))
                        .filter(seg => seg.segment.trim().length > 0)
                        .map(seg => seg.segment);
                } catch (e) {
                    this.fallbackTextProcessing(text);
                }
            } else {
                this.fallbackTextProcessing(text);
            }
        } else {
            this.words = [];
        }
        this.currentWordIndex = 0;
    }

    fallbackTextProcessing(text) {
        const splitPattern = /[\s\.\,\;\:\!\?\(\)\[\]\{\}\"\'\-\+\=\_\<\>\/\|\\\~\`\@\#\$\%\^&\*]+/;
        this.words = text.split(splitPattern).filter(word => word.length > 0);
    }
}