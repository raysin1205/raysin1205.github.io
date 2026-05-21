const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d");
const meterNodes = [...document.querySelectorAll("[data-meter]")];
const scenes = [...document.querySelectorAll("[data-scene]")];
const burstButtons = [...document.querySelectorAll("[data-burst]")];

const state = {
  width: 0,
  height: 0,
  ratio: 1,
  pointerX: 0,
  pointerY: 0,
  targetX: 0,
  targetY: 0,
  scroll: 0,
  scene: "intro",
  tick: 0,
  shards: [],
  bursts: [],
};

const palette = {
  red: "#e10600",
  black: "#050505",
  paper: "#fffaf2",
  cyan: "#28d9df",
  yellow: "#ffcf3a",
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function resize() {
  state.ratio = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.ratio);
  canvas.height = Math.floor(state.height * state.ratio);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
  seedShards();
}

function seedShards() {
  const count = Math.round(Math.min(90, Math.max(34, state.width / 18)));
  state.shards = Array.from({ length: count }, (_, index) => ({
    x: rand(-120, state.width + 120),
    y: rand(-120, state.height + 120),
    size: rand(16, 78),
    speed: rand(0.15, 0.9),
    angle: rand(-Math.PI, Math.PI),
    spin: rand(-0.015, 0.015),
    color: [palette.paper, palette.red, palette.black, palette.cyan, palette.yellow][index % 5],
    cut: rand(0.12, 0.42),
  }));
}

function polygon(points, fill, stroke = palette.black, width = 3) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function jaggedRect(x, y, w, h, color, tilt = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  polygon(
    [
      [-w / 2 + w * 0.04, -h / 2],
      [w / 2, -h / 2 + h * 0.08],
      [w / 2 - w * 0.08, h / 2],
      [-w / 2, h / 2 - h * 0.12],
    ],
    color,
    palette.black,
    4
  );
  ctx.restore();
}

function drawHalftone() {
  const spacing = state.width < 760 ? 22 : 18;
  const radius = state.scene === "stack" ? 3.5 : 2.5;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = palette.paper;
  for (let y = -spacing; y < state.height + spacing; y += spacing) {
    for (let x = -spacing; x < state.width + spacing; x += spacing) {
      const wave = Math.sin((x + state.tick * 20) * 0.015) + Math.cos((y - state.tick * 12) * 0.018);
      if (wave > 0.55) {
        ctx.beginPath();
        ctx.arc(x, y, radius + wave, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawShards() {
  ctx.save();
  for (const shard of state.shards) {
    shard.x += Math.cos(shard.angle) * shard.speed;
    shard.y += Math.sin(shard.angle) * shard.speed + 0.15;
    shard.angle += shard.spin;

    if (shard.x > state.width + 160) shard.x = -160;
    if (shard.x < -180) shard.x = state.width + 150;
    if (shard.y > state.height + 170) shard.y = -150;

    const pullX = (state.pointerX - state.width / 2) * 0.015;
    const pullY = (state.pointerY - state.height / 2) * 0.012;
    const s = shard.size;

    ctx.save();
    ctx.translate(shard.x + pullX, shard.y + pullY);
    ctx.rotate(shard.angle);
    ctx.globalAlpha = shard.color === palette.black ? 0.46 : 0.72;
    polygon(
      [
        [-s * 0.5, -s * shard.cut],
        [s * 0.45, -s * 0.5],
        [s * 0.5, s * 0.3],
        [-s * 0.34, s * 0.5],
      ],
      shard.color,
      shard.color === palette.black ? palette.paper : palette.black,
      2
    );
    ctx.restore();
  }
  ctx.restore();
}

function drawHeroMasks() {
  const pX = (state.pointerX - state.width / 2) * 0.04;
  const pY = (state.pointerY - state.height / 2) * 0.025;
  ctx.save();
  ctx.globalAlpha = 0.88;
  jaggedRect(state.width * 0.54 + pX, state.height * 0.13 + pY, state.width * 0.45, 78, palette.red, -0.18);
  jaggedRect(state.width * -0.08 - pX, state.height * 0.72 - pY, state.width * 0.55, 88, palette.paper, 0.15);
  jaggedRect(state.width * 0.67 - pX * 0.4, state.height * 0.66, state.width * 0.24, 56, palette.yellow, -0.28);
  ctx.restore();
}

function drawProfileScene() {
  ctx.save();
  ctx.globalAlpha = 0.95;
  for (let i = 0; i < 7; i += 1) {
    const y = 110 + i * 86 + Math.sin(state.tick * 2 + i) * 18;
    jaggedRect(state.width * 0.58, y, state.width * 0.5, 18, i % 2 ? palette.red : palette.paper, -0.08);
  }
  drawStar(state.width * 0.82, state.height * 0.34, 62, palette.yellow);
  ctx.restore();
}

function drawWorkScene() {
  ctx.save();
  ctx.globalAlpha = 0.86;
  const centerX = state.width * 0.78;
  const centerY = state.height * 0.46;
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 + state.tick * 0.5;
    const len = 120 + (i % 4) * 34;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * len, centerY + Math.sin(angle) * len);
    ctx.lineWidth = i % 3 === 0 ? 7 : 3;
    ctx.strokeStyle = i % 2 ? palette.red : palette.paper;
    ctx.stroke();
  }
  ctx.restore();
}

function drawStackScene() {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = palette.cyan;
  ctx.lineWidth = 2;
  const gap = 46;
  const drift = (state.tick * 34) % gap;
  for (let x = -gap; x < state.width + gap; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x + drift, 0);
    ctx.lineTo(x - state.height * 0.35 + drift, state.height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawContactScene() {
  ctx.save();
  const x = state.width * 0.14;
  const y = state.height * 0.22;
  ctx.globalAlpha = 0.8;
  drawStar(x, y, 90 + Math.sin(state.tick * 4) * 8, palette.red);
  drawStar(state.width * 0.86, state.height * 0.74, 72, palette.cyan);
  ctx.restore();
}

function drawStar(x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(state.tick * 0.65);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = palette.black;
  ctx.stroke();
  ctx.restore();
}

function addBurst(x, y) {
  state.bursts.push({
    x,
    y,
    age: 0,
    spokes: Array.from({ length: 18 }, (_, i) => ({
      angle: (i / 18) * Math.PI * 2 + rand(-0.16, 0.16),
      length: rand(26, 110),
      color: [palette.paper, palette.red, palette.yellow, palette.cyan][i % 4],
    })),
  });
}

function drawBursts() {
  for (let i = state.bursts.length - 1; i >= 0; i -= 1) {
    const burst = state.bursts[i];
    burst.age += prefersReducedMotion ? 1 : 0.035;
    const ease = 1 - Math.pow(1 - Math.min(burst.age, 1), 3);
    ctx.save();
    ctx.translate(burst.x, burst.y);
    ctx.globalAlpha = Math.max(0, 1 - burst.age);
    for (const spoke of burst.spokes) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(spoke.angle) * 12, Math.sin(spoke.angle) * 12);
      ctx.lineTo(
        Math.cos(spoke.angle) * spoke.length * ease,
        Math.sin(spoke.angle) * spoke.length * ease
      );
      ctx.lineWidth = 3 + (spoke.length % 4);
      ctx.strokeStyle = spoke.color;
      ctx.stroke();
    }
    ctx.restore();

    if (burst.age >= 1) {
      state.bursts.splice(i, 1);
    }
  }
}

function drawSceneAccent() {
  if (state.scene === "profile") drawProfileScene();
  if (state.scene === "work") drawWorkScene();
  if (state.scene === "stack") drawStackScene();
  if (state.scene === "contact") drawContactScene();
  if (state.scene === "intro") drawHeroMasks();
}

function render() {
  state.tick += prefersReducedMotion ? 0 : 0.016;
  state.pointerX += (state.targetX - state.pointerX) * 0.08;
  state.pointerY += (state.targetY - state.pointerY) * 0.08;

  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = state.scene === "intro" ? "rgba(5, 5, 5, 0.22)" : "rgba(5, 5, 5, 0.42)";
  ctx.fillRect(0, 0, state.width, state.height);

  drawHalftone();
  drawShards();
  drawSceneAccent();
  drawBursts();

  requestAnimationFrame(render);
}

function updateActiveScene() {
  const mid = window.scrollY + window.innerHeight * 0.48;
  let current = scenes[0].dataset.scene;

  for (const scene of scenes) {
    if (mid >= scene.offsetTop) current = scene.dataset.scene;
  }

  state.scene = current;
  meterNodes.forEach((node) => {
    node.classList.toggle("is-active", node.dataset.meter === current);
  });
}

window.addEventListener("resize", resize);
window.addEventListener("scroll", updateActiveScene, { passive: true });
window.addEventListener("pointermove", (event) => {
  state.targetX = event.clientX;
  state.targetY = event.clientY;
});
window.addEventListener("pointerdown", (event) => {
  addBurst(event.clientX, event.clientY);
});

burstButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    addBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    button.animate(
      [
        { transform: "translate(0, 0) rotate(-2deg)" },
        { transform: "translate(-5px, 3px) rotate(3deg)" },
        { transform: "translate(3px, -4px) rotate(-4deg)" },
        { transform: "translate(0, 0) rotate(0)" },
      ],
      { duration: 220, easing: "steps(4, end)" }
    );
    event.stopPropagation();
  });
});

resize();
state.targetX = state.pointerX = state.width * 0.5;
state.targetY = state.pointerY = state.height * 0.5;
updateActiveScene();
requestAnimationFrame(render);
