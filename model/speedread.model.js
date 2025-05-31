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
        if (!text) {
            this.words = [];
            this.currentWordIndex = 0;
            return;
        }
        if (this.supportsThaiSegmentation()) {
            this.segmentWithIntl(text);
        } else {
            this.fallbackTextProcessing(text);
        }
        this.currentWordIndex = 0;
    }

    supportsThaiSegmentation() {
        return typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined';
    }

    segmentWithIntl(text) {
        try {
            const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
            this.words = Array.from(segmenter.segment(text))
                .map(seg => seg.segment.trim())
                .filter(word => word.length > 0);
        } catch (error) {
            console.warn("Intl.Segmenter failed, falling back to regex:", error);
            this.fallbackTextProcessing(text);
        }
    }

    fallbackTextProcessing(text) {
        const splitPattern = /[\s.,;:!?()\[\]{}"'\-+=_<>\|\\~`@#$%^&*]+/;
        this.words = text.split(splitPattern).filter(word => word.trim().length > 0);
    }

    showNextWord() {
        if (this.currentWordIndex < this.words.length) {
            const word = this.words[this.currentWordIndex];
            this.currentWordIndex++;
            return word;
        } else {
            return "เสร็จสิ้น";
        }
    }

    resetPosition() {
        this.currentWordIndex = 0;
    }
}
