(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Evidence lightbox
     --------------------------------------------------------- */
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector("#lightbox-img");
  const lightboxCaption = document.querySelector("#lightbox-caption");
  const evidenceLinks = document.querySelectorAll(".evidence-open");

  if (lightbox && lightboxImage && lightboxCaption) {
    evidenceLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const image = link.querySelector("img");
        if (!image) return;

        event.preventDefault();
        lightboxImage.src = link.getAttribute("href");
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent =
          link.dataset.caption || image.alt;
        lightbox.showModal();
        document.body.style.overflow = "hidden";
      });
    });

    lightbox.addEventListener("close", () => {
      document.body.style.overflow = "";
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
    });

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });
  }

  /* ---------------------------------------------------------
     Reveal cards as they enter the viewport
     --------------------------------------------------------- */
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------------------------------------------------------
     Highlight the current section in both navigation lists
     --------------------------------------------------------- */
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const indexLinks = [...document.querySelectorAll(".skill-index a")];

  const toSection = (link) => {
    const id = link.getAttribute("href")?.replace("#", "");
    const element = id ? document.getElementById(id) : null;
    return element ? { id, element } : null;
  };

  const navSections = navLinks.map(toSection).filter(Boolean);
  const skillSections = indexLinks.map(toSection).filter(Boolean);

  const setCurrent = (links, activeId) => {
    links.forEach((link) => {
      const id = link.getAttribute("href")?.replace("#", "");
      if (id === activeId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateCurrent = () => {
    const line = window.innerHeight * 0.35;

    const pick = (items) => {
      let current = null;

      items.forEach(({ id, element }) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = id;
      });

      if (!current) {
        items.forEach(({ id, element }) => {
          if (element.getBoundingClientRect().top <= line) current = id;
        });
      }

      return current;
    };

    // Short final sections may never reach the selection line before scrolling ends.
    const atPageEnd =
      window.scrollY > 0 &&
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    const finalSection = navSections[navSections.length - 1];
    const finalSectionVisible =
      finalSection && finalSection.element.getBoundingClientRect().top < window.innerHeight;

    setCurrent(
      navLinks,
      atPageEnd && finalSectionVisible ? finalSection.id : pick(navSections)
    );

    const skillsSection = document.getElementById("skills");
    const skillsRect = skillsSection?.getBoundingClientRect();
    const insideSkills =
      skillsRect && skillsRect.top <= line && skillsRect.bottom > line;

    setCurrent(
      indexLinks,
      insideSkills ? pick(skillSections) || skillSections[0]?.id : null
    );
  };

  let ticking = false;

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateCurrent();
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  updateCurrent();
})();
