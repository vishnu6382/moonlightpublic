/**
 * High-performance lightweight Fireworks & Firecrackers Particle Engine
 * 60fps GPU-friendly celebration effects with 0 external dependencies.
 */

class Particle {
  constructor(x, y, color, speed, angle, isSparkle = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isSparkle = isSparkle;
    const rad = (angle * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed;
    this.vy = Math.sin(rad) * speed;
    this.gravity = 0.09;
    this.friction = 0.95;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.016;
    this.radius = isSparkle ? Math.random() * 2 + 1 : Math.random() * 2.5 + 1.2;
    this.trail = [];
    this.trailLength = isSparkle ? 1 : 2;
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;

    // Draw simple particle trail without expensive shadowBlur
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, pt.alpha * 0.4);
      ctx.fill();
    }

    // Outer soft glow ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, this.alpha * 0.25);
    ctx.fill();

    // Core bright spark
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = Math.max(0, this.alpha * 0.9);
    ctx.fill();
  }
}

let activeCanvas = null;
let activeCtx = null;
let particles = [];
let animFrameId = null;

function getOrCreateCanvas() {
  if (typeof window === 'undefined') return null;

  let canvas = document.getElementById('festive-fireworks-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'festive-fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();
  }

  activeCanvas = canvas;
  activeCtx = canvas.getContext('2d', { alpha: true });
  return activeCtx;
}

function runLoop() {
  if (!activeCtx || !activeCanvas) return;

  activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(activeCtx);
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  activeCtx.globalAlpha = 1;

  if (particles.length > 0) {
    animFrameId = requestAnimationFrame(runLoop);
  } else {
    animFrameId = null;
    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    if (activeCanvas) {
      activeCanvas.style.display = 'none'; // Unhook from compositor during normal browsing
    }
  }
}

/**
 * Triggers a vibrant explosion burst at (x, y) with a color palette.
 */
export function burstAt(x, y, colorPalette = ['#FFD700', '#FF3366', '#33FF88', '#FF9900', '#FFFFFF', '#00E5FF']) {
  const ctx = getOrCreateCanvas();
  if (!ctx || !activeCanvas) return;

  activeCanvas.style.display = 'block';

  const particleCount = 28;
  for (let i = 0; i < particleCount; i++) {
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const speed = Math.random() * 5 + 2;
    const angle = Math.random() * 360;
    const isSparkle = Math.random() > 0.5;
    particles.push(new Particle(x, y, color, speed, angle, isSparkle));
  }

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(runLoop);
  }
}

/**
 * Launches a grand celebration sequence with multiple bursts!
 */
export function launchCelebration() {
  if (typeof window === 'undefined') return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  const bursts = [
    { x: w * 0.5, y: h * 0.32, delay: 0 },
    { x: w * 0.28, y: h * 0.25, delay: 200 },
    { x: w * 0.72, y: h * 0.28, delay: 420 },
    { x: w * 0.5, y: h * 0.42, delay: 650 },
  ];

  bursts.forEach(({ x, y, delay }) => {
    setTimeout(() => {
      burstAt(x, y);
    }, delay);
  });
}
