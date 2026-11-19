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
        
        // Bounce animation properties
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

        // Small bounce effect when planted
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
        // Apply bounce offset to the y coordinate
        ctx.arc(this.x, this.y + this.bounceOffset, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }

    // Method to trigger the bounce
    bounce() {
        this.bounceVelocity = 2 + Math.random() * 2;
    }

    // Simplified version of the bounce for the 'planting' moment
    initBounce() {
        this.bounceVelocity = 1.5 + Math.random() * 1.5;
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
    
    const patch = new MossPatch(x, y);
    patch.initBounce();
    mossPatches.push(patch);
    ripples.push(new Ripple(x, y));
}

function toggleWeather(rainy) {
    isRainy = rainy;
    sunnyBtn.classList.toggle('active-weather', !rainy);
    rainyBtn.classList.toggle('active-weather', rainy);
    statusText.innerText = rainy ? "It's raining... the moss looks darker." : "Click to plant moss!";
}

function animate() {
    const bgColor = isRainy ? COLORS.rainy.rock : COLORS.sunny.rock;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ripples.forEach((ripple, index) => {
        ripple.update();
        if (ripple.opacity <= 0) {
            ripples.splice(index, 1);
        }
    });

    mossPatches.forEach(patch => {
        patch.update();
        patch.draw();
    });

    if (isRainy) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
    }

    requestAnimationFrame(animate);
}

canvas.addEventListener('mousedown', plantMoss);

sunnyBtn.addEventListener('click', () => toggleWeather(false));

rainyBtn.addEventListener('click', () => toggleWeather(true));

soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.innerText = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
});

animate();