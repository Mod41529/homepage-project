const revealItems = document.querySelectorAll(".reveal");
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
