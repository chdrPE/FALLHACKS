// Create canvas
const canvas = document.createElement('canvas');
canvas.id = 'bg-canvas';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Resize canvas to fit full page
function resizeCanvas() {
  canvas.width  = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', resizeCanvas);
resizeCanvas();

// Create particles
let particles = [];
function createParticles() {
  particles = [];
  const numParticles = 30;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 12 + 8,
      color: Math.random() < 0.5 ? 'white' : '#2EE6FF',
      speedX: (Math.random() - 0.5) * 1,
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

    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();