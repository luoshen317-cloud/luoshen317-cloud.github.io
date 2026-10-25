/* =====================================================================
   SCRIPT.JS — interaction layer
   ---------------------------------------------------------------------
   Everything here is progressive enhancement. With JavaScript disabled
   the page remains fully readable: the nav is shown, every paragraph is
   in the HTML, and the CSS reveals simply stay visible.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  var supportsIO = "IntersectionObserver" in window;
  var supportsSmooth = "scrollBehavior" in root.style;

  function reducedMotion() {
    return !!(reduceQuery && reduceQuery.matches);
  }

  function onMediaChange(query, callback) {
    if (!query) return;
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", callback);
    } else if (typeof query.addListener === "function") {
      query.addListener(callback);
    }
  }

  /* -------------------------------------------------------------------
     LOCAL TIME
     A small, honest detail in the hero meta row. Uses the visitor's own
     clock; replace or remove it with your city time if you prefer.
     ------------------------------------------------------------------- */
  function startClock() {
    var nodes = document.querySelectorAll("[data-clock]");
    if (!nodes.length) return;

    function tick() {
      var now = new Date();
      var text;

      try {
        text = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);
      } catch (error) {
        text = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      }

      Array.prototype.forEach.call(nodes, function (node) {
        node.textContent = text;
      });
    }

    tick();
    window.setInterval(tick, 30000);
  }

  /* -------------------------------------------------------------------
     HEADER, SCROLL PROGRESS, ACTIVE SECTION
     ------------------------------------------------------------------- */
  function startScrollUI() {
    var header = document.querySelector("[data-header]");
    var progress = document.querySelector("[data-scroll-progress]");
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link, .menu-nav a"));
    var ticking = false;
    var activeId = "";

    if (!sections.length && !header && !progress) return;

    function setActive(id) {
      if (!id || id === activeId) return;
      activeId = id;

      navLinks.forEach(function (link) {
        var hash = link.getAttribute("href") || "";
        if (hash === "#" + id) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function currentSection() {
      var headerHeight = header ? header.offsetHeight : 0;
      var probe = headerHeight + Math.min(window.innerHeight * 0.3, 260);
      var atBottom =
        window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 8;
      var current = sections.length ? sections[0].id : "";

      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= probe) {
          current = section.id;
        }
      });

      if (atBottom) current = "contact";
      return current;
    }

    function update() {
      ticking = false;

      if (header) {
        header.classList.toggle("is-scrolled", window.pageYOffset > 16);
      }

      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
        progress.style.transform = "scaleX(" + ratio + ")";
      }

      setActive(currentSection());
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("orientationchange", requestUpdate);
    update();
  }

  /* -------------------------------------------------------------------
     ANCHOR LINKS
     Smooth scrolling with a fixed-header offset; also closes the mobile
     menu before travelling. The CSS scroll-margin-top covers deep links.
     ------------------------------------------------------------------- */
  function scrollToId(id, instant) {
    var target = document.getElementById(id);
    if (!target) return;

    var header = document.querySelector("[data-header]");
    var offset = header ? header.offsetHeight + 2 : 2;
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

    top = Math.max(0, top);

    if (instant || reducedMotion() || !supportsSmooth) {
      window.scrollTo(0, top);
      return;
    }

    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function startAnchors() {
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;

      var hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;

      var id = hash.slice(1);
      if (id === "main") return;

      var target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();

      var dialog = document.getElementById("menu");
      if (dialog && dialog.open) dialog.close();

      scrollToId(id, false);

      if (window.history && window.history.pushState) {
        try {
          window.history.pushState(null, "", hash);
        } catch (error) {
          /* file:// and some embedded webviews refuse history updates. */
        }
      }
    });
  }

  /* -------------------------------------------------------------------
     MOBILE MENU — native <dialog> does the focus trap and Escape key.
     ------------------------------------------------------------------- */
  function startMenu() {
    var dialog = document.getElementById("menu");
    var openButton = document.querySelector("[data-menu-open]");
    if (!dialog || !openButton) return;

    var closeButton = dialog.querySelector("[data-menu-close]");
    var lastFocus = null;
    var hasModal = typeof dialog.showModal === "function";

    function openMenu() {
      if (dialog.open) return;
      lastFocus = document.activeElement;
      if (!lastFocus || lastFocus === document.body) lastFocus = openButton;
      openButton.setAttribute("aria-expanded", "true");
      root.classList.add("is-locked");

      if (hasModal) {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }

      window.requestAnimationFrame(function () {
        try {
          dialog.focus({ preventScroll: true });
        } catch (error) {
          dialog.focus();
        }
      });
    }

    function afterClose() {
      root.classList.remove("is-locked");
      openButton.setAttribute("aria-expanded", "false");

      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus({ preventScroll: true });
        } catch (error) {
          lastFocus.focus();
        }
      }
      lastFocus = null;
    }

    function closeMenu() {
      if (!dialog.open) return;
      if (hasModal) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
        afterClose();
      }
    }

    openButton.addEventListener("click", openMenu);
    if (closeButton) closeButton.addEventListener("click", closeMenu);

    if (hasModal) {
      dialog.addEventListener("close", afterClose);
    }

    /* Click the paper outside the menu panel to dismiss. */
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeMenu();
    });

    /* If the viewport grows past the mobile breakpoint, leave the panel. */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && dialog.open) closeMenu();
    });
  }

  /* -------------------------------------------------------------------
     WORD-BY-WORD REVEALS
     Splits a sentence into inline-block words. If anything fails, the
     original paragraph is untouched and fully legible.
     ------------------------------------------------------------------- */
  function splitWords(element) {
    if (!element || element.getAttribute("data-words-ready") === "true") return;

    var text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    var words = text.split(" ");
    var fragment = document.createDocumentFragment();

    words.forEach(function (word, index) {
      var outer = document.createElement("span");
      var inner = document.createElement("span");

      outer.className = "word";
      inner.className = "word-in";
      inner.textContent = word;
      outer.appendChild(inner);
      fragment.appendChild(outer);

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    element.textContent = "";
    element.appendChild(fragment);
    element.classList.add("words");
    element.setAttribute("data-words-ready", "true");
    element.style.setProperty("--word-step", Math.min(38, Math.round(900 / words.length)) + "ms");
  }

  function startReveals() {
    var revealNodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    var wordNodes = Array.prototype.slice.call(document.querySelectorAll("[data-words]"));
    var drawNodes = Array.prototype.slice.call(document.querySelectorAll("[data-draw]"));
    var workNodes = Array.prototype.slice.call(document.querySelectorAll(".work-item"));
    var heroWords = document.querySelector(".hero-lede[data-words]");

    wordNodes.forEach(splitWords);

    function reveal(element) {
      element.classList.add("is-visible");
      if (element.classList.contains("work-item")) element.classList.add("is-inview");
      if (element.hasAttribute("data-draw")) element.classList.add("is-drawn");
    }

    if (reducedMotion() || !supportsIO) {
      revealNodes.concat(wordNodes, drawNodes, workNodes).forEach(reveal);
      if (heroWords) heroWords.classList.add("is-visible");
      return;
    }

    root.classList.add("reveals-on");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    var seen = [];
    revealNodes.concat(wordNodes, drawNodes, workNodes).forEach(function (element) {
      if (seen.indexOf(element) !== -1) return;
      seen.push(element);
      observer.observe(element);
    });

    /* The hero is always above the fold: let it arrive with the curtain. */
    if (heroWords) {
      window.setTimeout(function () {
        heroWords.classList.add("is-visible");
      }, 160);
    }
  }

  /* -------------------------------------------------------------------
     CURSOR WARMTH
     A soft light that follows a fine pointer, painted behind the page
     content. It is skipped entirely on touch and reduced motion.
     ------------------------------------------------------------------- */
  function startCursorGlow() {
    var glow = document.querySelector("[data-cursor-glow]");
    if (!glow || !hoverQuery.matches || reducedMotion()) return;

    var targetX = window.innerWidth * 0.72;
    var targetY = window.innerHeight * 0.36;
    var currentX = targetX;
    var currentY = targetY;
    var running = false;

    function paint() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform =
        "translate3d(" + currentX.toFixed(1) + "px," + currentY.toFixed(1) + "px,0)";

      if (Math.abs(targetX - currentX) > 0.4 || Math.abs(targetY - currentY) > 0.4) {
        window.requestAnimationFrame(paint);
      } else {
        running = false;
      }
    }

    function kick() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener(
      "pointermove",
      function (event) {
        if (!hoverQuery.matches || reducedMotion()) return;
        targetX = event.clientX;
        targetY = event.clientY;
        glow.classList.add("is-active");
        kick();
      },
      { passive: true }
    );

    window.addEventListener("blur", function () {
      glow.classList.remove("is-active");
    });
  }

  /* -------------------------------------------------------------------
     MAGNETIC TILT
     One rAF loop per element, reading its own geometry. Subtle by design:
     a few degrees and a few pixels, never enough to blur the type.
     ------------------------------------------------------------------- */
  function startTilt() {
    if (!hoverQuery.matches || reducedMotion()) return;

    var elements = Array.prototype.slice.call(document.querySelectorAll("[data-tilt]"));

    elements.forEach(function (element) {
      var strength = parseFloat(element.getAttribute("data-tilt-strength")) || 2.2;
      var maxShift = Math.min(7, strength * 1.7);
      var targetX = 0;
      var targetY = 0;
      var targetRX = 0;
      var targetRY = 0;
      var currentX = 0;
      var currentY = 0;
      var currentRX = 0;
      var currentRY = 0;
      var active = false;
      var frame = 0;

      function render() {
        frame = 0;

        var dx = targetX - currentX;
        var dy = targetY - currentY;
        var drx = targetRX - currentRX;
        var dry = targetRY - currentRY;

        currentX += dx * 0.16;
        currentY += dy * 0.16;
        currentRX += drx * 0.16;
        currentRY += dry * 0.16;

        element.style.transform =
          "translate3d(" +
          currentX.toFixed(2) +
          "px," +
          currentY.toFixed(2) +
          "px,0) perspective(900px) rotateX(" +
          currentRX.toFixed(2) +
          "deg) rotateY(" +
          currentRY.toFixed(2) +
          "deg)";

        if (
          active ||
          Math.abs(dx) > 0.02 ||
          Math.abs(dy) > 0.02 ||
          Math.abs(drx) > 0.02 ||
          Math.abs(dry) > 0.02
        ) {
          frame = window.requestAnimationFrame(render);
        } else {
          element.style.transform = "";
          element.classList.remove("is-tilting");
        }
      }

      function kick() {
        if (frame) return;
        frame = window.requestAnimationFrame(render);
      }

      function reset() {
        active = false;
        targetX = 0;
        targetY = 0;
        targetRX = 0;
        targetRY = 0;
        kick();
      }

      element.addEventListener("pointermove", function (event) {
        if (!hoverQuery.matches || reducedMotion()) return;

        var rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;

        targetRY = px * strength * 2;
        targetRX = -py * strength * 2;
        targetX = px * maxShift;
        targetY = py * maxShift * 0.65;
        active = true;
        element.classList.add("is-tilting");
        kick();
      });

      element.addEventListener("pointerleave", reset);
      element.addEventListener("blur", reset);
    });

    onMediaChange(reduceQuery, function () {
      if (!reducedMotion()) return;
      elements.forEach(function (element) {
        element.style.transform = "";
        element.classList.remove("is-tilting");
      });
    });
  }

  /* -------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------- */
  function boot() {
    root.classList.add("is-ready");
    startClock();
    startScrollUI();
    startAnchors();
    startMenu();
    startReveals();
    startCursorGlow();
    startTilt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
