// === StreakIn Theme: Blue background + cyan & white particles ===

// Set background color
document.body.style.backgroundColor = '#0A2540'; // deep blue

// Create canvas for particles
const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width  = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', resizeCanvas);
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Create particles (white & cyan)
function createParticles() {
  particles = [];
  const numParticles = 50;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 10 + 5,
      color: Math.random() < 0.5 ? 'white' : '#2EE6FF', // mix of white and cyan
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5
    });
  }
}
createParticles();

// Animate particles
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    p.x += p.speedX;
    p.y += p.speedY;

    // Bounce particles softly off edges
    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

// Optional: style buttons to match theme
const style = document.createElement('style');
style.textContent = `
  .streakin-header {
    background: #0D2E57; /* darker blue for header */
    color: white;
  }

  .streakin-lockin-btn, .streakin-submit-btn {
    background: #2EE6FF; /* cyan */
    color: #0A2540;      /* dark blue text */
  }

  .streakin-lockin-btn:hover, .streakin-submit-btn:hover {
    filter: brightness(0.9);
  }

  .streakin-container {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    backdrop-filter: blur(10px);
    border-radius: 1rem;
  }
`;
document.head.appendChild(style);
