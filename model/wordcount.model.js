// Model: Text analysis/statistics functions

function countWordsLogic(text) {
    return (!text.trim() ? 0 : text.trim().split(/\s+/).length);
}

function countUniqueWordsLogic(text) {
    return (!text.trim() ? 0 : new Set(text.toLowerCase().trim().match(/\b(\w+)\b/g) || []).size);
}

function countSentencesLogic(text) {
    return (!text.trim() ? 0 : (text.match(/[.!?…]+(\s+|$)/g) || []).length);
}

function countParagraphsLogic(text) {
    return (!text.trim() ? 1 : text.split(/\n{2,}/).filter(p => p.trim() !== '').length);
}

function calculateAllStats(text) {
    const chars = text.length;
    const noSpaces = text.replace(/\s/g, '').length;
    const words = countWordsLogic(text);
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const sentences = countSentencesLogic(text);
    const paragraphs = countParagraphsLogic(text);
    const unique = countUniqueWordsLogic(text);

    const avgLen = words > 0 ? (noSpaces / words) : 0;
    const readingSpeedWPM = 200;
    const minutesToRead = words / readingSpeedWPM;
    const secondsToRead = minutesToRead * 60;

    return {
        chars, noSpaces, words, lines, sentences, paragraphs,
        unique, avgLen,
        minutesToRead: minutesToRead,
        secondsToRead: Math.max(0, Math.ceil(secondsToRead))
    };
}

// Export for controller
window.WordCountModel = {
    countWordsLogic,
    countUniqueWordsLogic,
    countSentencesLogic,
    countParagraphsLogic,
    calculateAllStats
};