/* ==========================================================================
   VAITEBLEK — Main Script
   Handles: theme (auto light/dark + manual toggle), navbar scroll state,
   mobile menu, AOS animation init, simple quote form UX.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Theme: detect OS preference, allow manual override ---------- */
  const THEME_KEY = "vb-theme";
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  applyTheme(getPreferredTheme());

  // React to OS theme changes only if the user hasn't manually chosen one
  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "light" : "dark");
      }
    });

  document.addEventListener("DOMContentLoaded", () => {
    const toggleBtns = document.querySelectorAll("[data-theme-toggle]");
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const current =
          root.getAttribute("data-theme") === "light" ? "light" : "dark";
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
      });
    });

    /* ---------- Navbar scroll state + top loading/progress bar ---------- */
    const nav = document.querySelector(".navbar-vb");
    const progressBar = document.getElementById("scroll-progress");
    const onScroll = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
      if (progressBar) {
        const h = document.documentElement;
        const pct = (window.scrollY / (h.scrollHeight - h.clientHeight)) * 100;
        progressBar.style.width = Math.min(Math.max(pct, 0), 100) + "%";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- Mobile menu (Bootstrap collapse handles most; close on link click) ---------- */
    const navCollapse = document.getElementById("vbNavCollapse");
    if (navCollapse) {
      navCollapse.querySelectorAll("a.nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
          if (bsCollapse && navCollapse.classList.contains("show")) {
            bsCollapse.hide();
          }
        });
      });
    }

    /* ---------- Clients marquee: bulletproof infinite loop ----------
       Clone the track's items until it is at least 2x the wrapper width,
       so the CSS -50% animation always lines up perfectly (no jump/stall),
       no matter how many logos or how wide the images end up being. */
    function initMarquee() {
      document.querySelectorAll(".marquee-wrap").forEach((wrap) => {
        const track = wrap.querySelector(".marquee-track");
        if (!track || track.dataset.mqReady) return;
        const originalItems = Array.from(track.children);
        let guard = 0;
        while (track.scrollWidth < wrap.clientWidth * 2 && guard < 8) {
          originalItems.forEach((item) =>
            track.appendChild(item.cloneNode(true)),
          );
          guard++;
        }
        track.dataset.mqReady = "1";
      });
    }
    initMarquee();
    window.addEventListener("load", initMarquee);
    window.addEventListener("resize", () => {
      document
        .querySelectorAll(".marquee-track")
        .forEach((t) => (t.dataset.mqReady = ""));
      initMarquee();
    });

    /* ---------- Write a Review: star rating + service chip + WhatsApp submit ---------- */
    const rvState = {
      en: { rating: 0, service: null },
      ar: { rating: 0, service: null },
    };

    window.pickRvStar = function (lang, value) {
      rvState[lang].rating = value;
      const row = document.getElementById(
        lang === "ar" ? "rvStarRowAr" : "rvStarRowEn",
      );
      if (!row) return;
      row.querySelectorAll(".rv-star-btn").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.dataset.v) <= value);
      });
      const err = document.getElementById(
        lang === "ar" ? "rvErrAr" : "rvErrEn",
      );
      if (err) err.textContent = "";
    };

    window.pickRvChip = function (el) {
      const isActive = el.classList.contains("active");
      el.parentElement
        .querySelectorAll(".rv-chip")
        .forEach((c) => c.classList.remove("active"));
      if (!isActive) el.classList.add("active");
      const lang = el.closest("#rvChipsAr") ? "ar" : "en";
      rvState[lang].service = isActive ? null : el.textContent.trim();
    };

    window.submitRvForm = function (lang) {
      const isAr = lang === "ar";
      const nameEl = document.getElementById(isAr ? "rvNameAr" : "rvNameEn");
      const textEl = document.getElementById(isAr ? "rvTextAr" : "rvTextEn");
      const errEl = document.getElementById(isAr ? "rvErrAr" : "rvErrEn");
      const name = (nameEl?.value || "").trim();
      const text = (textEl?.value || "").trim();
      const rating = rvState[lang].rating;
      const service = rvState[lang].service;

      if (!rating) {
        if (errEl)
          errEl.textContent = isAr
            ? "من فضلك اختر تقييمك بالنجوم."
            : "Please pick a star rating.";
        return;
      }
      if (!name) {
        if (errEl)
          errEl.textContent = isAr
            ? "من فضلك اكتب اسمك أو اسم شركتك."
            : "Please enter your name or company.";
        nameEl?.focus();
        return;
      }
      if (!text) {
        if (errEl)
          errEl.textContent = isAr
            ? "من فضلك اكتب تجربتك معانا."
            : "Please share your experience.";
        textEl?.focus();
        return;
      }
      if (errEl) errEl.textContent = "";

      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const msg = isAr
        ? `تقييم جديد لـ VAITEBLEK ⭐\nالتقييم: ${stars} (${rating}/5)\nالاسم: ${name}${service ? `\nالخدمة: ${service}` : ""}\nالتجربة: ${text}`
        : `New VAITEBLEK Review ⭐\nRating: ${stars} (${rating}/5)\nName: ${name}${service ? `\nService: ${service}` : ""}\nExperience: ${text}`;

      window.open(
        `https://wa.me/201554001997?text=${encodeURIComponent(msg)}`,
        "_blank",
      );

      // Reset the form after a successful send
      window.pickRvStar(lang, 0);
      document
        .getElementById(isAr ? "rvStarRowAr" : "rvStarRowEn")
        ?.querySelectorAll(".rv-star-btn")
        .forEach((btn) => btn.classList.remove("active"));
      rvState[lang] = { rating: 0, service: null };
      document
        .querySelectorAll(`#${isAr ? "rvChipsAr" : "rvChipsEn"} .rv-chip`)
        .forEach((c) => c.classList.remove("active"));
      if (nameEl) nameEl.value = "";
      if (textEl) textEl.value = "";
      const charEl = document.getElementById(isAr ? "rvCharAr" : "rvCharEn");
      if (charEl) charEl.textContent = "0";
    };

    /* ---------- Lenis: buttery smooth scrolling ---------- */
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let lenis = null;
    if (window.Lenis && !prefersReducedMotion) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      // Keep in-page anchor links (nav, footer, "See Our Work") working with Lenis
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id === "#") return;
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -70 });
          }
        });
      });
    }

    /* ---------- tsParticles: subtle hero particle network ---------- */
    if (
      window.tsParticles &&
      document.getElementById("tsparticles") &&
      !prefersReducedMotion
    ) {
      const isLight = root.getAttribute("data-theme") === "light";
      tsParticles.load("tsparticles", {
        fpsLimit: 60,
        fullScreen: { enable: false },
        background: { color: "transparent" },
        particles: {
          number: { value: 46, density: { enable: true, area: 900 } },
          color: { value: ["#4F6EF7", "#8B5CF6", "#EC4899"] },
          links: {
            enable: true,
            distance: 130,
            color: isLight ? "#0f172a" : "#ffffff",
            opacity: isLight ? 0.12 : 0.14,
            width: 1,
          },
          move: { enable: true, speed: 0.6, outModes: { default: "out" } },
          opacity: { value: 0.5 },
          size: { value: { min: 1, max: 3 } },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: "grab" }, resize: true },
          modes: { grab: { distance: 140, links: { opacity: 0.35 } } },
        },
        detectRetina: true,
      });
    }

    /* ---------- GSAP: premium hero entrance timeline ---------- */
    if (window.gsap) {
      const heroTargets = {
        logo: document.querySelector('[data-hero="logo"]'),
        badge: document.querySelector('[data-hero="badge"]'),
        lines: document.querySelectorAll(".hero-line"),
        sub: document.querySelector('[data-hero="sub"]'),
        btns: document.querySelector('[data-hero="btns"]'),
        stats: document.querySelector('[data-hero="stats"]'),
      };
      if (heroTargets.logo) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          heroTargets.logo,
          { opacity: 0, scale: 0.4, rotate: -25 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.9 },
        )
          .fromTo(
            heroTargets.badge,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=.45",
          )
          .fromTo(
            heroTargets.lines,
            { opacity: 0, y: "100%" },
            { opacity: 1, y: "0%", duration: 0.8, stagger: 0.12 },
            "-=.3",
          )
          .fromTo(
            heroTargets.sub,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=.45",
          )
          .fromTo(
            heroTargets.btns,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=.4",
          )
          .fromTo(
            heroTargets.stats,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=.4",
          );
      }

      // Gentle parallax drift on the hero blobs while scrolling
      if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.utils.toArray(".hero-blob").forEach((blob, i) => {
          gsap.to(blob, {
            y: (i + 1) * 60,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      }
    }

    /* ---------- Magnetic buttons: subtle cursor-follow pull on hover ---------- */
    if (
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !prefersReducedMotion
    ) {
      document.querySelectorAll(".btn-magnetic").forEach((btn) => {
        btn.addEventListener("mousemove", (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "translate(0, 0)";
        });
      });

      /* ---------- Custom cursor glow ---------- */
      const glow = document.createElement("div");
      glow.className = "cursor-glow";
      document.body.appendChild(glow);
      let glowShown = false;
      window.addEventListener("mousemove", (e) => {
        glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        if (!glowShown) {
          glow.classList.add("is-active");
          glowShown = true;
        }
      });
      window.addEventListener("mouseleave", () =>
        glow.classList.remove("is-active"),
      );
    }

    /* ---------- AOS init ---------- */
    if (window.AOS) {
      AOS.init({
        duration: 700,
        easing: "ease-out-cubic",
        once: true,
        offset: 60,
        disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }

    /* ---------- Project gallery lightbox (GLightbox) ----------
       Every project thumbnail (.glightbox) opens a popup.
       Items sharing the same data-gallery value become slides in
       one slider automatically — see index.html/ar.html: to add
       more photos to a project, duplicate its <a class="glightbox">
       tag with the same data-gallery value and a different image. */
    if (window.GLightbox) {
      GLightbox({
        selector: ".glightbox",
        touchNavigation: true,
        loop: false,
        zoomable: true,
        closeButton: true,
        moreLength: 0,
      });
    }

    /* ---------- Simple counter animation for hero stats ---------- */
    const counters = document.querySelectorAll("[data-count]");
    if (counters.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseFloat(el.dataset.count);
            const suffix = el.dataset.suffix || "";
            const duration = 1200;
            const start = performance.now();
            function tick(now) {
              const progress = Math.min((now - start) / duration, 1);
              const value = Math.floor(progress * target);
              el.textContent = value + suffix;
              if (progress < 1) requestAnimationFrame(tick);
              else el.textContent = target + suffix;
            }
            requestAnimationFrame(tick);
            io.unobserve(el);
          });
        },
        { threshold: 0.4 },
      );
      counters.forEach((c) => io.observe(c));
    }

    /* ---------- Quote form: basic client-side handling -> WhatsApp handoff ---------- */
    const quoteForm = document.getElementById("vbQuoteForm");
    if (quoteForm) {
      quoteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(quoteForm);
        const name = data.get("name") || "";
        const service = data.get("service") || "";
        const details = data.get("details") || "";
        const isArabic = document.documentElement.lang === "ar";
        const msg = isArabic
          ? `مرحبا VAITEBLEK، اسمي ${name}. أنا مهتم بخدمة: ${service}. تفاصيل: ${details}`
          : `Hello VAITEBLEK, my name is ${name}. I'm interested in: ${service}. Details: ${details}`;
        const waNumber = "201554001997";
        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
      });
    }

    /* ---------- Back-to-top ---------- */
    const topBtn = document.querySelector("[data-back-to-top]");
    if (topBtn) {
      window.addEventListener(
        "scroll",
        () => {
          topBtn.style.display = window.scrollY > 500 ? "flex" : "none";
        },
        { passive: true },
      );
      topBtn.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: "smooth" }),
      );
    }
  });
})();
