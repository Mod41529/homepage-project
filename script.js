const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (shouldReduceMotion) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const videoEl = document.getElementById("hero-video");
if (videoEl) {
  videoEl.addEventListener("error", () => {
    document.body.classList.add("video-fallback");
  });

  const playPromise = videoEl.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      document.body.classList.add("video-fallback");
    });
  }
}

const themeToggle = document.getElementById("theme-toggle");
const themeKey = "mangam-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.setAttribute("aria-label", theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
  }
  localStorage.setItem(themeKey, theme);
}

const initialTheme = localStorage.getItem(themeKey) || "dark";
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

const modal = document.getElementById("project-modal");
const titleEl = document.getElementById("project-modal-title");
const summaryEl = document.getElementById("project-modal-summary");
const periodEl = document.getElementById("project-modal-period");
const stackEl = document.getElementById("project-modal-stack");
const resultEl = document.getElementById("project-modal-result");
const linksEl = document.getElementById("project-modal-links");

const cards = document.querySelectorAll(".card[data-title]");
let lastActiveCard = null;

function makeAbsolute(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return "";
  }
}

function addLink(url, label, type = "link") {
  const safeUrl = makeAbsolute(url);
  if (!safeUrl) {
    return null;
  }

  const safe = safeUrl.toLowerCase();
  const isLocal = safe.startsWith(window.location.origin);
  if (!safe.startsWith("http://") && !safe.startsWith("https://") && !isLocal) {
    return null;
  }

  const a = document.createElement("a");
  a.href = safe;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.className = "project-link";
  a.textContent = label;
  a.dataset.type = type;
  return a;
}

function openModal(card) {
  if (!modal || !titleEl || !summaryEl || !periodEl || !stackEl || !resultEl || !linksEl) {
    return;
  }

  titleEl.textContent = card.dataset.title || "프로젝트 상세";
  summaryEl.textContent = card.dataset.summary || "요약이 등록되지 않았습니다.";
  periodEl.textContent = card.dataset.period || "진행 중";
  stackEl.textContent = card.dataset.stack || "미등록";
  resultEl.textContent = card.dataset.result || "기록 예정";

  linksEl.innerHTML = "";
  const linkItems = [
    {
      url: card.dataset.link,
      label: card.dataset.linkLabel || "관련 링크",
      type: "primary"
    },
    {
      url: card.dataset.demo,
      label: card.dataset.demoLabel || "작업 자료",
      type: "secondary"
    }
  ];

  const renderedLinks = [];
  linkItems.forEach((item) => {
    const created = addLink(item.url, item.label, item.type);
    if (created) {
      linksEl.appendChild(created);
      renderedLinks.push(created);
    }
  });

  if (!renderedLinks.length) {
    const p = document.createElement("p");
    p.className = "project-links-empty";
    p.textContent = "현재 연결된 링크가 없습니다.";
    linksEl.appendChild(p);
  }

  modal.setAttribute("data-open", "true");
  modal.setAttribute("aria-hidden", "false");
  lastActiveCard = card;
}

function closeModal() {
  if (!modal) {
    return;
  }

  modal.setAttribute("data-open", "false");
  modal.setAttribute("aria-hidden", "true");
  if (lastActiveCard) {
    lastActiveCard.focus();
  }
}

cards.forEach((card) => {
  card.addEventListener("click", () => openModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card);
    }
  });
});

modal?.querySelectorAll("[data-close]").forEach((target) => {
  target.addEventListener("click", closeModal);
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal || event.target.classList.contains("project-modal-backdrop")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.getAttribute("data-open") === "true") {
    closeModal();
  }
});

const gravityCanvas = document.getElementById("gravity-canvas");
const saveDataMode = Boolean(navigator.connection && navigator.connection.saveData);
let pointer = { x: 0, y: 0, active: false };
let compactMode = window.innerWidth <= 768;
let width = 0;
let height = 0;
let dpr = window.devicePixelRatio || 1;

function setCompactMode() {
  compactMode = window.innerWidth <= 768 || window.innerHeight <= 620;
}

function resizeCanvas(ctx, canvas, particles) {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const targetCount = Math.min(160, Math.max(38, Math.round((width * height) / (compactMode ? 13000 : 9500)));
  while (particles.length < targetCount) {
    particles.push(createParticle());
  }
  while (particles.length > targetCount) {
    particles.pop();
  }

  if (!pointer.active) {
    pointer.x = width * 0.5;
    pointer.y = height * 0.6;
  }
}

function createParticle() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * (compactMode ? 0.28 : 0.35),
    vy: (Math.random() - 0.5) * (compactMode ? 0.28 : 0.35),
    radius: 0.7 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.002 + Math.random() * 0.0025
  };
}

function applyCardLift(cardsEls) {
  const nx = (pointer.x - width / 2) / (width / 2);
  const ny = (pointer.y - height / 2) / (height / 2);
  cardsEls.forEach((card) => {
    const depth = parseFloat(card.dataset.depth || "0");
    const xFactor = compactMode ? 8 : 14;
    const yFactor = compactMode ? 4 : 9;
    card.style.setProperty("--card-lift-x", `${nx * depth * -xFactor}px`);
    card.style.setProperty("--card-lift-y", `${ny * depth * -yFactor}px`);
  });
}

function startGravity() {
  if (!gravityCanvas || shouldReduceMotion || saveDataMode) {
    if (gravityCanvas) {
      gravityCanvas.remove();
    }
    return;
  }

  const ctx = gravityCanvas.getContext("2d");
  if (!ctx) {
    gravityCanvas.remove();
    return;
  }

  const cardsEls = document.querySelectorAll("[data-depth]");
  const particles = [];
  setCompactMode();
  resizeCanvas(ctx, gravityCanvas, particles);

  let targetX = width * 0.5;
  let targetY = height * 0.6;
  let smoothX = targetX;
  let smoothY = targetY;

  function setPointer(event) {
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    targetX = pointer.x;
    targetY = pointer.y;
  }

  function resetPointer() {
    pointer.active = false;
    targetX = width * 0.5;
    targetY = height * 0.6;
    pointer.x = targetX;
    pointer.y = targetY;
  }

  function handleTouchMove(event) {
    if (!event.touches.length) {
      return;
    }

    setPointer(event.touches[0]);
  }

  function step() {
    smoothX += (targetX - smoothX) * 0.07;
    smoothY += (targetY - smoothY) * 0.07;
    pointer.x = smoothX;
    pointer.y = smoothY;

    ctx.clearRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.56;
    const now = performance.now();
    const localPointerRepel = pointer.active ? 1000000 : 0;
    const maxConnDist = compactMode ? 100 : 128;
    const maxConnDistSq = maxConnDist * maxConnDist;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const rx = p.x - pointer.x;
      const ry = p.y - pointer.y;
      const dist = Math.sqrt(rx * rx + ry * ry) + 40;
      const repel = pointer.active ? Math.min(localPointerRepel / (dist * dist), compactMode ? 0.12 : 0.15) : 0;

      p.vx += (rx / dist) * repel;
      p.vy += (ry / dist) * repel;
      p.vx += (cx - p.x) * 0.00015;
      p.vy += (cy - p.y) * 0.00013;
      p.vx += Math.sin(now * p.speed + p.phase) * (compactMode ? 0.008 : 0.012);
      p.vy += Math.cos(now * p.speed * 1.4 + p.phase) * (compactMode ? 0.008 : 0.012);

      p.vx *= compactMode ? 0.985 : 0.98;
      p.vy *= compactMode ? 0.985 : 0.98;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) {
        p.x = width;
      }
      if (p.x > width) {
        p.x = 0;
      }
      if (p.y < 0) {
        p.y = height;
      }
      if (p.y > height) {
        p.y = 0;
      }

      const alpha = 0.35 + Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 7);
      ctx.beginPath();
      ctx.fillStyle = `rgba(180, 235, 255, ${alpha})`;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const skip = compactMode ? 2 : 1;
    const localRadius = compactMode ? 72 : 84;
    for (let i = 0; i < particles.length; i += skip) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += skip) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dd = dx * dx + dy * dy;
        if (dd < maxConnDistSq) {
          if (compactMode && dd > localRadius * localRadius) {
            continue;
          }
          const opacity = (1 - Math.sqrt(dd) / maxConnDist) * 0.18;
          ctx.strokeStyle = `rgba(120, 212, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    applyCardLift(cardsEls);
    requestAnimationFrame(step);
  }

  window.addEventListener("mousemove", setPointer);
  window.addEventListener("mouseleave", resetPointer);
  window.addEventListener("touchmove", handleTouchMove, { passive: true });
  window.addEventListener("touchstart", handleTouchMove, { passive: true });
  window.addEventListener("touchend", resetPointer);
  window.addEventListener("resize", () => {
    setCompactMode();
    resizeCanvas(ctx, gravityCanvas, particles);
  });

  requestAnimationFrame(step);
}

startGravity();
