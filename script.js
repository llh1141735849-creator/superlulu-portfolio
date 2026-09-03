const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeStorageKey = "portfolio-theme-20260806";

function activeTheme() {
  const saved = root.dataset.theme;
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

function updateThemeLabel() {
  const current = activeTheme();
  themeToggle.textContent = current === "dark" ? "浅色" : "深色";
  themeToggle.setAttribute(
    "aria-label",
    current === "dark" ? "切换到浅色主题" : "切换到深色主题",
  );
  themeMeta?.setAttribute("content", current === "dark" ? "#161617" : "#f5f5f7");
}

try {
  const storedTheme = localStorage.getItem(themeStorageKey);
  root.dataset.theme = storedTheme === "light" ? "light" : "dark";
} catch {
  root.dataset.theme = "dark";
}
updateThemeLabel();

themeToggle.addEventListener("click", () => {
  const nextTheme = activeTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  try {
    localStorage.setItem(themeStorageKey, nextTheme);
  } catch {}
  updateThemeLabel();
});

const reveals = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6%" },
  );

  reveals.forEach((element) => observer.observe(element));
}

const portfolioVideos = document.querySelectorAll("video");

portfolioVideos.forEach((video) => {
  video.addEventListener("play", () => {
    portfolioVideos.forEach((otherVideo) => {
      if (otherVideo !== video && !otherVideo.paused) otherVideo.pause();
    });
  });
});

const spotlightTargets = document.querySelectorAll(
  [
    ".hero-visual",
    ".proof-item",
    ".library-index a",
    ".case",
    ".result-tile",
    ".result-band",
    ".method-track li",
    ".experience-timeline article",
    ".contact",
  ].join(","),
);
const supportsPrecisePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

spotlightTargets.forEach((target) => {
  target.classList.add("spotlight-surface");

  if (!supportsPrecisePointer) return;

  const updateSpotlight = (event) => {
    const bounds = target.getBoundingClientRect();
    target.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    target.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  };

  target.addEventListener("pointerenter", (event) => {
    updateSpotlight(event);
    target.classList.add("is-spotlit");
  });
  target.addEventListener("pointermove", updateSpotlight);
  target.addEventListener("pointerleave", () => target.classList.remove("is-spotlit"));
});

const carouselTracks = document.querySelectorAll(
  ".library-grid-influencer, .library-grid-ai, .library-strip, .library-grid-tvc",
);

carouselTracks.forEach((track) => {
  const cards = Array.from(track.querySelectorAll(":scope > .library-card"));
  if (cards.length < 2) return;

  const carousel = document.createElement("div");
  const toolbar = document.createElement("div");
  const currentTitle = document.createElement("p");
  const controls = document.createElement("div");
  const previousButton = document.createElement("button");
  const nextButton = document.createElement("button");

  carousel.className = "portfolio-carousel-shell";
  toolbar.className = "portfolio-carousel-toolbar";
  currentTitle.className = "portfolio-carousel-current";
  currentTitle.setAttribute("aria-live", "polite");
  controls.className = "portfolio-carousel-controls";

  previousButton.className = "portfolio-carousel-button";
  previousButton.type = "button";
  previousButton.textContent = "上一条";
  previousButton.setAttribute("aria-label", "查看上一条作品");

  nextButton.className = "portfolio-carousel-button";
  nextButton.type = "button";
  nextButton.textContent = "下一条";
  nextButton.setAttribute("aria-label", "查看下一条作品");

  controls.append(previousButton, nextButton);
  toolbar.append(currentTitle, controls);
  track.before(carousel);
  carousel.append(toolbar, track);

  track.classList.add("portfolio-carousel");
  track.setAttribute("role", "region");
  track.setAttribute("aria-roledescription", "作品轮播");
  track.scrollLeft = 0;

  let activeIndex = 0;
  let rotationPosition = 0;
  let pointerStartX = null;

  const cardTitle = (card) => card.querySelector("figcaption strong")?.textContent.trim() || "作品";

  const pauseCarouselVideos = (exceptVideo = null) => {
    cards.forEach((card) => {
      const video = card.querySelector("video");
      if (video && video !== exceptVideo && !video.paused) video.pause();
    });
  };

  const updateCoverflow = () => {
    if (track.scrollLeft !== 0) track.scrollLeft = 0;
    const trackWidth = track.clientWidth || carousel.clientWidth || window.innerWidth;
    const radiusX = Math.min(520, Math.max(205, trackWidth * 0.4));
    const radiusDepth = Math.min(380, Math.max(220, trackWidth * 0.28));
    const fullTurn = Math.PI * 2;

    cards.forEach((card, cardIndex) => {
      const angle = ((cardIndex - rotationPosition) / cards.length) * fullTurn;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const frontness = (cosine + 1) / 2;
      const scale = 0.52 + frontness * 0.48;
      const opacity = frontness < 0.08 ? 0 : 0.12 + frontness * 0.88;
      const isVisible = frontness >= 0.08;

      card.style.setProperty("--coverflow-x", `${sine * radiusX}px`);
      card.style.setProperty("--coverflow-y", `${(1 - cosine) * 48}px`);
      card.style.setProperty("--coverflow-z", `${(cosine - 1) * radiusDepth}px`);
      card.style.setProperty("--coverflow-rotate", `${sine * -30}deg`);
      card.style.setProperty("--coverflow-scale", scale);
      card.style.setProperty("--coverflow-opacity", opacity);
      card.style.setProperty("--coverflow-layer", Math.round(frontness * 90));
      card.classList.toggle("is-coverflow-visible", isVisible);
      card.setAttribute("aria-hidden", isVisible ? "false" : "true");
    });
  };

  const setActiveCard = (nextRotationPosition) => {
    pauseCarouselVideos();
    rotationPosition = nextRotationPosition;
    activeIndex = ((Math.round(rotationPosition) % cards.length) + cards.length) % cards.length;

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === activeIndex;
      const video = card.querySelector("video");
      card.classList.toggle("is-carousel-active", isActive);
      card.setAttribute("aria-current", isActive ? "true" : "false");
      card.tabIndex = isActive ? 0 : -1;

      if (video) {
        video.controls = isActive;
        video.tabIndex = isActive ? 0 : -1;
        video.hidden = !isActive;
        if (!isActive) video.removeAttribute("poster");
        if (!isActive && !video.paused) video.pause();
      }
    });

    updateCoverflow();
    if (carouselHasEntered) loadCarouselPosters();
    currentTitle.textContent = `当前作品：${cardTitle(cards[activeIndex])}`;
  };

  const rotateBy = (steps) => setActiveCard(rotationPosition + steps);

  const goToCard = (index) => {
    const currentNormalized = ((Math.round(rotationPosition) % cards.length) + cards.length) % cards.length;
    let delta = ((index - currentNormalized) % cards.length + cards.length) % cards.length;
    if (delta > cards.length / 2) delta -= cards.length;
    setActiveCard(rotationPosition + delta);
  };

  cards.forEach((card, cardIndex) => {
    const video = card.querySelector("video");
    const media = card.querySelector(".library-media");

    if (video && media) {
      const posterImage = document.createElement("img");
      posterImage.className = "carousel-poster";
      posterImage.dataset.src = video.dataset.poster || "";
      posterImage.loading = "lazy";
      posterImage.decoding = "async";
      posterImage.alt = "";
      posterImage.setAttribute("aria-hidden", "true");
      media.prepend(posterImage);
    }

    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `${cardTitle(card)}，第 ${cardIndex + 1} 条，共 ${cards.length} 条`);
    card.addEventListener("click", (event) => {
      if (cardIndex === activeIndex) return;
      event.preventDefault();
      goToCard(cardIndex);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        rotateBy(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        rotateBy(1);
      }
    });
  });

  previousButton.addEventListener("click", () => rotateBy(-1));
  nextButton.addEventListener("click", () => rotateBy(1));

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
  });

  track.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const deltaX = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(deltaX) < 46) return;
    rotateBy(deltaX < 0 ? 1 : -1);
  });

  track.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  track.addEventListener(
    "scroll",
    () => {
      if (track.scrollLeft !== 0) track.scrollLeft = 0;
    },
    { passive: true },
  );

  let carouselHasEntered = false;
  const loadPosterForCard = (card) => {
    const image = card.querySelector(".carousel-poster");
    const video = card.querySelector("video");
    const source = image?.dataset.src || video?.dataset.poster || "";
    if (!source) return;
    const isActive = card.classList.contains("is-carousel-active");
    if (image && !image.getAttribute("src")) {
      image.loading = "eager";
      image.src = source;
    }
    if (video && isActive && !video.poster) video.poster = source;
  };

  const loadCarouselPosters = () => {
    cards.forEach((card) => loadPosterForCard(card));
  };

  if ("IntersectionObserver" in window) {
    const posterObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        carouselHasEntered = true;
        loadCarouselPosters();
        posterObserver.disconnect();
      },
      { rootMargin: "180px 0px" },
    );
    posterObserver.observe(carousel);
  } else {
    const loadVisibleCarouselPosters = () => {
      const bounds = carousel.getBoundingClientRect();
      const isNearViewport = bounds.bottom > -180 && bounds.top < window.innerHeight + 180;
      if (!isNearViewport) return;
      carouselHasEntered = true;
      loadCarouselPosters();
      window.removeEventListener("scroll", loadVisibleCarouselPosters);
      window.removeEventListener("resize", loadVisibleCarouselPosters);
    };
    window.addEventListener("scroll", loadVisibleCarouselPosters, { passive: true });
    window.addEventListener("resize", loadVisibleCarouselPosters, { passive: true });
    loadVisibleCarouselPosters();
  }

  if ("ResizeObserver" in window) {
    const coverflowResizeObserver = new ResizeObserver(updateCoverflow);
    coverflowResizeObserver.observe(track);
  } else {
    window.addEventListener("resize", updateCoverflow, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    const carouselObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) pauseCarouselVideos();
      },
      { threshold: 0.18 },
    );
    carouselObserver.observe(carousel);
  }

  setActiveCard(0);
});
