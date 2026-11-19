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

class MossPatch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5;
        this.growthRate = Math.random() * 0.02 + 0.01;
        this.maxSize = this.size * (2 + Math.random() * 2);
        this.opacity = 0;
        this.fadeSpeed = 0.01 + Math.random() * 0.02;
    }

    update() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        }
        if (this.opacity < 1) {
            this.opacity += this.fadeSpeed;
        }
    }

    draw() {
        const color = isRainy ? COLORS.rainy.moss : COLORS.sunny.moss;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 30;
        this.opacity = 0.6;
        this.speed = 1.5;
    }

    update() {
        this.radius += this.speed;
        this.opacity -= 0.02;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

function plantMoss(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mossPatches.push(new MossPatch(x, y));
    ripples.push(new Ripple(x, y));
}

function toggleWeather(rainy) {
    isRainy = rainy;
    sunnyBtn.classList.toggle('active-weather', !rainy);
    rainyBtn.classList.toggle('active-weather', rainy);
    statusText.innerText = rainy ? "It's raining... moss is drinking!" : "The sun is out! Plant more moss!";
}

sunnyBtn.addEventListener('click', () => toggleWeather(false));
rainyBtn.addEventListener('click', () => toggleWeather(true));

soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.innerText = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
});

canvas.addEventListener('mousedown', plantMoss);

function animate() {
    ctx.fillStyle = isRainy ? COLORS.rainy.rock : COLORS.sunny.rock;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    mossPatches.forEach(patch => {
        patch.update();
        patch.draw();
    });

    ripples.forEach((ripple, index) => {
        ripple.update();
        ripple.draw();
        if (ripple.opacity <= 0) {
            ripples.splice(index, 1);
        }    
    });

    requestAnimationFrame(animate);
}

animate();