const canvas = document.getElementById('mossCanvas');
const ctx = canvas.getContext('2d');
const sunnyBtn = document.getElementById('sunny-btn');
const rainyBtn = document.getElementById('rainy-btn');
const soundToggle = document.getElementById('sound-toggle');
const statusText = document.getElementById('status-text');

canvas.width = 800;
canvas.height = 600;

let isRainy = false;
let soundEnabled = true;
let mossPatches = [];
let ripples = [];

const COLORS = {
    sunny: { moss: '#7fb331', rock: '#7a7a7a' },
    rainy: { moss: '#3d6321', rock: '#5a5a5a' }
};

// --- Audio System ---
let audioCtx = null;
let rainNoise = null;
let rainNoiseGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function createRainNoise() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    return { source: whiteNoise, gain: gainNode };
}

function playDropSound(type) {
    if (!audioCtx || !soundEnabled) return;
    
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    oscillator.type = 'sine';
    const freq = type === 'rock' ? 800 + Math.random() * 400 : 400 + Math.random() * 200;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function updateRainAudio() {
    if (!audioCtx) return;
    if (isRainy) {
        if (!rainNoise) {
            const noise = createRainNoise();
            rainNoise = noise.source;
            rainNoiseGain = noise.gain;
            rainNoise.start();
        }
        rainNoiseGain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.1);
    } else {
        if (rainNoiseGain) {
            rainNoiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
    }
    
    if (!soundEnabled) {
        if (rainNoiseGain) rainNoiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
}

class MossPatch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5;
        this.growthRate = Math.random() * 0.02 + 0.01;
        this.maxSize = this.size * (2 + Math.random() * 2);
        this.opacity = 0;
        this.fadeSpeed = 0.01 + Math.random() * 0.02;
        
        this.bounceOffset = 0;
        this.bounceVelocity = 0;
        this.bounceGravity = 0.15;
        this.bounceSpring = 0.1;
        this.bounceDamping = 0.7;
    }

    update() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        }
        if (this.opacity < 1) {
            this.opacity += this.fadeSpeed;
        }

        if (this.bounceVelocity !== 0) {
            this.bounceOffset += this.bounceVelocity;
            this.bounceVelocity -= this.bounceGravity;
            
            if (Math.abs(this.bounceOffset) < 0.5 && Math.abs(this.bounceVelocity) < 0.2) {
                this.bounceOffset = 0;
                this.bounceVelocity = 0;
            }
        }
    }

    draw() {
        const color = isRainy ? COLORS.rainy.moss : COLORS.sunny.moss;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.bounceOffset, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }

    initBounce() {
        this.bounceVelocity = 1.5 + Math.random();
    }
}

class RainDrop {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.speed = Math.random() * 5 + 10;
        this.length = Math.random() * 10 + 10;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
            // Play drop sound when it hits bottom
            if (isRainy && soundEnabled) {
                playDropSound('rock');
            }
        }
    }

    draw() {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
        ctx.closePath();
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 0;
        this.maxSize = Math.random() * 20 + 10;
        this.opacity = 1;
        this.fadeSpeed = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.size += 1.5;
        this.opacity -= this.fadeSpeed;
    }

    draw() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
    }
}

function drawRock() {
    const rockX = 100;
    const rockY = 150;
    const rockW = 600;
    const rockH = 300;

    // 1. Soft Shadow
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowOffsetY = 20;

    // 2. Rock Gradient
    const rockColor = isRainy ? COLORS.rainy.rock : COLORS.sunny.rock;
    const gradient = ctx.createRadialGradient(
        rockX + rockW / 2, rockY + rockH / 2, 50, 
        rockX + rockW / 2, rockY + rockH / 2, 400
    );
    
    // Light center, darker edges
    const baseColor = rockColor === '#5a5a5a' ? {r: 90, g: 90, b: 90} : {r: 122, g: 122, b: 122};
    const darkerColor = rockColor === '#5a5a5a' ? {r: 60, g: 60, b: 60} : {r: 80, g: 80, b: 80};
    
    gradient.addColorStop(0, `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
    gradient.addColorStop(1, `rgb(${darkerColor.r}, ${darkerColor.g}, ${darkerColor.b})`);

    ctx.fillStyle = gradient;
    
    // Draw rounded rock shape
    ctx.beginPath();
    ctx.roundRect(rockX, rockY, rockW, rockH, 80);
    ctx.fill();
    ctx.closePath();

    // Reset shadow for other elements
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3. Texture/Speckles
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rockX, rockY, rockW, rockH, 80);
    ctx.clip();
    
    for (let i = 0; i < 300; i++) {
        const sx = rockX + Math.random() * rockW;
        const sy = rockY + Math.random() * rockH;
        const sSize = Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(sx, sy, sSize, sSize);
    }
    ctx.restore();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawRock();
    
    mossPatches.forEach(patch => {
        patch.update();
        patch.draw();
    }
    );
    
    ripples.forEach((ripple, index) => {
        ripple.update();
        ripple.draw();
        if (ripple.opacity <= 0) {
            ripples.splice(index, 1);
        }
    }
    );

    if (isRainy) {
        const drops = new Array(50).fill(0).map(() => new RainDrop());
        // This is a bit inefficient, but for simplicity in this project
        // we recreate drops every frame. Instead, we's keep them in an array.
    }
    // Fixed rain loop to be more performant
    if (isRainy) {
        // We'll actually use a a fixed set of drops for better performance
    }
    
    // For a better rain implementation, let's handle it in a loop
    // But since the original script had it, I'll keep the logic
    // However, I'm fixing the rain drop creation to avoid memory leaks
    if (isRainy) {
        // We'll use a global array for drops
    }

    requestAnimationFrame(animate);
}

// To fix the rain drop memory leak, let's implement a fixed array
const rainDrops = new Array(100).fill(0).map(() => new RainDrop());

function renderRain() {
    if (!isRainy) return;
    rainDrops.forEach(drop => {
        drop.update();
        drop.draw();
    }
    );
}

function updatedAnimate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawRock();
    
    mossPatches.forEach(patch => {
        patch.update();
        patch.draw();
    }
    );
    
    ripples.forEach((ripple, index) => {
        ripple.update();
        ripple.draw();
        if (ripple.opacity <= 0) {
            ripples.splice(index, 1);
        }
    }
    );

    renderRain();
    
    requestAnimationFrame(updatedAnimate);
}

// --- Event Listeners ---

canvas.addEventListener('mousedown', (e) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is inside the rock area
    if (x > 100 && x < 700 && y > 150 && y < 450) {
        mossPatches.push(new MossPatch(x, y));
        statusText.innerText = 'You planted some moss!';
        if (isRainy) {
            ripples.push(new Ripple(x, y));
        }
    }
    
    if (isRainy) {
        mossPatches.forEach(patch => {
            patch.initBounce();
        }
    }
    );
});

canvas.addEventListener('mousemove', (e) => {
    if (isRainy) {
        // Randomly trigger ripples on the rock surface
        if (Math.random() < 0.05) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const xCoord = 100 + Math.random() * 600;
            const yCoord = 150 + Math.random() * 100 + Math.random() * 200;
            // Only if it's raining and the mouse is moving
            if (xCoord > 100 && xCoord > 700) { // Logic check
                 // This was meant to be an example of ripple effect
            }
        }
    }
    });

    // Correcting the mousemove logic to be just a function
    // But wait, I'm just updating script.js
});

// Weather buttons
sunnyBtn.addEventListener('click', () => {
    isRainy = false;
    sunnyBtn.classList.add('active-weather');
    rainyBtn.classList.remove('active-weather');
    statusText.innerText = 'The sun is shining!';
    updateRainAudio();
});

rainyBtn.addEventListener('click', () => {
    isRainy = true;
    rainyBtn.classList.add('active-weather');
    );
    statusText.innerText = 'It is raining!';
    updateRainAudio();
});

// Sound toggle
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.innerText = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
    updateRainAudio();
});

// Start the animation loop
updatedAnimate();