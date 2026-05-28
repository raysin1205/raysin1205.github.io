const canvas = document.querySelector("#ambient-canvas");
const ctx = canvas.getContext("2d");
const toast = document.querySelector("#toast");
const emailButton = document.querySelector("[data-copy-email]");
const previewLinks = document.querySelectorAll(".eva-easter-link");
const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const email = "liangrx25@mails.tsinghua.edu.dn";
const state = {
  width: 0,
  height: 0,
  ratio: 1,
  pointerX: 0,
  pointerY: 0,
  targetX: 0,
  targetY: 0,
  tick: 0,
  petals: [],
  stars: [],
};

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(email);
    showToast("邮箱已复制");
  } catch {
    window.location.href = `mailto:${email}`;
  }
}

function setupPreviewVideo(link) {
  const video = link.querySelector("video");
  if (!video) return;

  const play = () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  };
  const rewind = () => {
    video.pause();
    video.currentTime = 0;
  };

  link.addEventListener("pointerenter", play);
  link.addEventListener("focusin", play);
  link.addEventListener("pointerleave", rewind);
  link.addEventListener("focusout", rewind);
}

function resizeCanvas() {
  state.ratio = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.ratio);
  canvas.height = Math.floor(state.height * state.ratio);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);

  const petalCount = Math.min(46, Math.max(18, Math.floor(state.width / 28)));
  const starCount = Math.min(72, Math.max(26, Math.floor(state.width / 20)));

  state.petals = Array.from({ length: petalCount }, (_, index) => ({
    x: random(-80, state.width + 80),
    y: random(-80, state.height + 80),
    size: random(6, 17),
    speed: random(0.12, 0.42),
    sway: random(0.5, 1.8),
    phase: random(0, Math.PI * 2),
    color: index % 5 === 0 ? "rgba(43, 154, 160, 0.24)" : "rgba(233, 111, 146, 0.28)",
  }));

  state.stars = Array.from({ length: starCount }, () => ({
    x: random(0, state.width),
    y: random(0, state.height),
    r: random(0.5, 1.8),
    alpha: random(0.12, 0.38),
  }));
}

function drawPetal(petal) {
  const driftX = Math.sin(state.tick * petal.sway + petal.phase) * 18;
  const pointerPullX = (state.pointerX - state.width / 2) * 0.008;
  const pointerPullY = (state.pointerY - state.height / 2) * 0.006;

  petal.y += prefersReducedMotion ? 0 : petal.speed;
  petal.x += prefersReducedMotion ? 0 : Math.sin(state.tick + petal.phase) * 0.08;

  if (petal.y > state.height + 60) {
    petal.y = -60;
    petal.x = random(-80, state.width + 80);
  }

  ctx.save();
  ctx.translate(petal.x + driftX + pointerPullX, petal.y + pointerPullY);
  ctx.rotate(Math.sin(state.tick * 0.8 + petal.phase) * 0.7);
  ctx.fillStyle = petal.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, petal.size * 0.38, petal.size, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(star, index) {
  const pulse = Math.sin(state.tick * 1.2 + index) * 0.12;
  ctx.save();
  ctx.globalAlpha = star.alpha + pulse;
  ctx.fillStyle = "#202124";
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRibbon() {
  const offset = Math.sin(state.tick * 0.55) * 24;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = Math.max(1, state.width * 0.006);
  ctx.strokeStyle = "#b94064";
  ctx.beginPath();
  ctx.moveTo(-80, state.height * 0.24 + offset);
  ctx.bezierCurveTo(
    state.width * 0.28,
    state.height * 0.08 - offset,
    state.width * 0.58,
    state.height * 0.4 + offset,
    state.width + 80,
    state.height * 0.18 - offset
  );
  ctx.stroke();

  ctx.strokeStyle = "#2b9aa0";
  ctx.lineWidth = Math.max(1, state.width * 0.003);
  ctx.beginPath();
  ctx.moveTo(-80, state.height * 0.72 - offset);
  ctx.bezierCurveTo(
    state.width * 0.24,
    state.height * 0.88 + offset,
    state.width * 0.62,
    state.height * 0.52 - offset,
    state.width + 80,
    state.height * 0.76 + offset
  );
  ctx.stroke();
  ctx.restore();
}

function drawFrame() {
  state.tick += prefersReducedMotion ? 0 : 0.016;
  state.pointerX += (state.targetX - state.pointerX) * 0.08;
  state.pointerY += (state.targetY - state.pointerY) * 0.08;

  ctx.clearRect(0, 0, state.width, state.height);
  drawRibbon();
  state.stars.forEach(drawStar);
  state.petals.forEach(drawPetal);
  window.requestAnimationFrame(drawFrame);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => observer.observe(item));
previewLinks.forEach(setupPreviewVideo);
emailButton.addEventListener("click", copyEmail);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  state.targetX = event.clientX;
  state.targetY = event.clientY;
});

resizeCanvas();
state.targetX = state.pointerX = state.width * 0.5;
state.targetY = state.pointerY = state.height * 0.5;
drawFrame();
