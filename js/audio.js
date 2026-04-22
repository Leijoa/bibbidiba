// js/audio.js
let audioCtx = null;
let soundEnabled = false;

export function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
}

export function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled && !audioCtx) {
        initAudio();
    }
    return soundEnabled;
}

function playTone(freq, type, duration, vol=0.1) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export function playRollSound() {
    if (!soundEnabled) return;
    // Rapid tick for rolling
    playTone(600 + Math.random()*200, 'square', 0.02, 0.05);
}

export function playAttackSound() {
    if (!soundEnabled) return;
    // Impact sound
    playTone(150, 'sawtooth', 0.2, 0.2);
    setTimeout(() => playTone(100, 'square', 0.3, 0.3), 50);
}

export function playBuySound() {
    if (!soundEnabled) return;
    // Chime
    playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 100);
}

export function playClickSound() {
    if (!soundEnabled) return;
    playTone(400, 'sine', 0.05, 0.05);
}
