// js/audio.js
let audioCtx = null;
export let sfxVolume = 0.5;
export let bgmVolume = 0.5;

export function setSFXVolume(vol) {
    sfxVolume = Math.max(0, Math.min(1, vol));
}

export function setBGMVolume(vol) {
    bgmVolume = Math.max(0, Math.min(1, vol));
    const bgmEl = document.getElementById('bgm');
    if (bgmEl) {
        bgmEl.volume = bgmVolume;
    }
}

export function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
}

export function playBGM() {
    const bgmEl = document.getElementById('bgm');
    if (bgmEl && bgmEl.src && bgmEl.paused) {
        bgmEl.volume = bgmVolume;
        bgmEl.play().catch(e => console.warn("BGM autoplay blocked:", e));
    }
}

export function pauseBGM() {
    const bgmEl = document.getElementById('bgm');
    if (bgmEl && !bgmEl.paused) {
        bgmEl.pause();
    }
}

function playTone(freq, type, duration, vol=0.1) {
    if (sfxVolume <= 0 || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Scale the base volume by the user's SFX volume setting
    const finalVol = vol * sfxVolume;
    gainNode.gain.setValueAtTime(finalVol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export function playRollSound() {
    if (sfxVolume <= 0) return;
    // Rapid tick for rolling
    playTone(600 + Math.random()*200, 'square', 0.02, 0.05);
}

export function playAttackSound() {
    if (sfxVolume <= 0) return;
    // Impact sound
    playTone(150, 'sawtooth', 0.2, 0.2);
    setTimeout(() => playTone(100, 'square', 0.3, 0.3), 50);
}

export function playBuySound() {
    if (sfxVolume <= 0) return;
    // Chime
    playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 100);
}

export function playClickSound() {
    if (sfxVolume <= 0) return;
    playTone(400, 'sine', 0.05, 0.05);
}
