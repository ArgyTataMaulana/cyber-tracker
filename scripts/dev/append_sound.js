const fs = require('fs');

const jsCode = `
/* ==================== SOUNDBOARD MEMES ==================== */
const MEME_SOUNDS = {
    default: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
    yey: 'https://www.myinstants.com/media/sounds/yey.mp3',
    wow: 'https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3',
    jokowi: 'https://www.myinstants.com/media/sounds/ya-ndak-tau-kok-tanya-saya-meme.mp3',
    prabowo: 'https://www.myinstants.com/media/sounds/omon-omon.mp3',
    bruh: 'https://www.myinstants.com/media/sounds/movie_1.mp3'
};

function playMemeSound(overrideSound = null, test = false) {
    const s = getState();
    // Only play if notifications are enabled OR if it's a direct test from settings
    if (!test && s.profile.notifications === false) return; 
    
    const soundKey = overrideSound || s.profile.memeSound || 'default';
    const url = MEME_SOUNDS[soundKey] || MEME_SOUNDS.default;
    
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Audio play blocked:", e));
}
`;

fs.appendFileSync('app.js', jsCode, 'utf8');
