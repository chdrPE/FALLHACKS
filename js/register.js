const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const circles = [];
const colors = ['#2EE6FF', '#1AC1E0', '#00B4D8', '#90E0EF'];

function createCircles(num) {
  for (let i = 0; i < num; i++) {
    circles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 20 + 5,
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.3
    });
  }
}

function animate() {
  ctx.fillStyle = '#0A2540'; 
  ctx.fillRect(0, 0, width, height);

  circles.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(c.color)},${c.alpha})`;
    ctx.fill();

    c.x += c.dx;
    c.y += c.dy;

    if (c.x < -c.radius) c.x = width + c.radius;
    if (c.x > width + c.radius) c.x = -c.radius;
    if (c.y < -c.radius) c.y = height + c.radius;
    if (c.y > height + c.radius) c.y = -c.radius;
  });

  requestAnimationFrame(animate);
}

function hexToRgb(hex) {
  hex = hex.replace('#','');
  const bigint = parseInt(hex,16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

createCircles(60);
animate();

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});
