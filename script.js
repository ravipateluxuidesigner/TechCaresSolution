/* TechCares Solutions: interactions
   Clinical design system behaviours: header + menu, sliding nav indicator, reveals, hero scroll,
   image-swap list, clickable timeline, quote carousel, FAQ accordion, enquiry form (WhatsApp handoff).
   Everything is a class toggle; CSS does the motion. prefers-reduced-motion shows final states. */
(function () {
  "use strict";
  var d = document, de = d.documentElement;
  de.classList.add("js");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desk = function () { return window.matchMedia("(min-width: 901px)").matches; };

  /* ---------- every page always opens at its top (unless the URL names a #section) ----------
     Browser scroll restoration is switched off, and the top position is re-applied for the first
     seconds in case a host page or late layout moves it. scrollIntoView also resets a host page that
     embeds this site in a frame. Stops the moment the visitor scrolls themselves. */
  (function () {
    if (location.hash) return;
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
    var stop = false;
    var toTop = function () {
      if (stop) return;
      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
      try { (d.getElementById("clh") || d.body).scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {}
    };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) { window.addEventListener(t, function () { stop = true; }, { once: true, passive: true }); });
    toTop();
    [60, 250, 700, 1500].forEach(function (ms) { setTimeout(toTop, ms); });
    window.addEventListener("load", toTop);
    window.addEventListener("pageshow", toTop);
  })();

  /* ---------- header + mobile menu ---------- */
  var hdr = $("#clh"), burger = $("#clb"), menu = $("#clm");
  function setMenu(o) {
    if (!menu || !burger) return;
    menu.classList.toggle("open", o);
    burger.setAttribute("aria-expanded", String(o));
    burger.setAttribute("aria-label", o ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!o));
    d.body.style.overflow = o ? "hidden" : "";
    $$("a", menu).forEach(function (a) { a.tabIndex = o ? 0 : -1; });
  }
  if (menu && burger) {
    setMenu(false);
    burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); burger.focus(); } });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.matchMedia("(min-width: 1181px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
    window.addEventListener("pageshow", function () { setMenu(false); });
    /* keep Tab inside the open menu */
    menu.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !menu.classList.contains("open")) return;
      var f = $$("a", menu).concat([burger]); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- nav indicator: a bar slides under the current link and follows hover/focus ---------- */
  var nav = $("#cln"), ind = $(".cl-nav-ind");
  function moveInd(a) {
    if (!a || !ind || !nav.offsetWidth) return;
    ind.style.width = a.offsetWidth + "px";
    ind.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  if (nav && ind) {
    var cur = $("[aria-current]", nav), ready = false;
    var home = function () {
      moveInd(cur);
      /* first placement is instant (no slide-in from the left); later moves animate */
      if (!ready && nav.offsetWidth) { ready = true; setTimeout(function () { ind.classList.add("rdy"); }, 60); }
    };
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(home);
    home(); window.addEventListener("resize", home);
    if (window.ResizeObserver) new ResizeObserver(home).observe(nav);   /* webfont swap, zoom, theme: keep the pill on the link */
    $$("a", nav).forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveInd(a); });
      a.addEventListener("focus", function () { moveInd(a); });
    });
    nav.addEventListener("mouseleave", home);
    nav.addEventListener("focusout", home);
  }

  /* ---------- reveals: one observer, each element reveals once ---------- */
  var rv = $$(".cl-rv");
  var show = function (e) { e.classList.add("in"); };
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (e) { io.observe(e); });
  } else { rv.forEach(show); }
  /* one-time backstop: anything already on screen after load is shown even if the observer is late */
  setTimeout(function () {
    var vh = window.innerHeight;
    rv.forEach(function (e) {
      if (e.classList.contains("in")) return;
      var r = e.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) show(e);
    });
  }, 1200);

  /* ---------- scroll: header state, progress bar, hero image scale, grid drift ---------- */
  var heroImg = $("#clhi"), grid = $(".cl-hero-grid"), pgBar = $("#clpg"), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, H = de.scrollHeight - vh;
    if (hdr) hdr.classList.toggle("sc", y > 40);
    if (pgBar) pgBar.style.transform = "scaleX(" + (H > 0 ? Math.min(1, y / H) : 0).toFixed(4) + ")";
    if (!reduce && y < vh * 1.3) {
      if (grid) { grid.style.setProperty("--sy", y.toFixed(0)); grid.style.setProperty("--sx", (y * 0.03).toFixed(1)); }
      if (heroImg) heroImg.style.transform = desk() ? "scale(" + (1 + Math.min(y, vh) * 0.00022).toFixed(4) + ")" : "";
    }
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener("resize", frame);
  frame();


  /* ---------- type hero: the glow drifts with the pointer ---------- */
  (function () {
    var hero = $(".cl-hero--type"); if (!hero || reduce) return;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3)); hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
  })();


  /* ---------- type hero: letters swell toward the pointer (variable-font weight) ---------- */
  (function () {
    var h = $(".cl-ht-h"), hero = $(".cl-hero--type"); if (!h || !hero || reduce || !window.matchMedia("(hover: hover)").matches) return;
    var base = parseInt(getComputedStyle(h).fontWeight, 10) || 700, max = Math.min(base + 120, 800), reach = 280, letters = [];
    $$(".cl-ln > span", h).forEach(function (line) {
      (function walk(n) {
        Array.prototype.slice.call(n.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var f = d.createDocumentFragment();
            c.textContent.split("").forEach(function (ch) { if (ch === " ") { f.appendChild(d.createTextNode(" ")); return; } var s = d.createElement("span"); s.className = "cl-lt"; s.textContent = ch; f.appendChild(s); letters.push(s); });
            n.replaceChild(f, c);
          } else if (c.nodeType === 1 && !c.classList.contains("cl-lt")) walk(c);
        });
      })(line);
    });
    var mx = -999, my = -999, raf = 0;
    var paint = function () {
      raf = 0;
      letters.forEach(function (l) {
        var r = l.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);
        l.style.fontWeight = Math.round(base + (max - base) * t * t * (3 - 2 * t));
      });
    };
    hero.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
    hero.addEventListener("pointerleave", function () { mx = my = -999; if (!raf) raf = requestAnimationFrame(paint); });
  })();

  /* ---------- service cards: the active card carries the stronger hierarchy ---------- */
  $$(".cl-sg").forEach(function (sg) {
    var cards = $$(".cl-sc", sg);
    var act = function (c) { cards.forEach(function (x) { x.classList.toggle("on", x === c); }); };
    cards.forEach(function (c) {
      c.addEventListener("mouseenter", function () { act(c); });
      c.addEventListener("focus", function () { act(c); });
    });
  });


  /* ---------- service cards expand in place (details replace the card body; nothing else moves) ---------- */
  $$(".cl-sg").forEach(function (grid) {
    var cards = $$("[data-sc]", grid);
    var lock = function (except) { cards.forEach(function (c) { if (c !== except && !c.style.height) { c.style.height = c.offsetHeight + "px"; c.setAttribute("data-lock", ""); } }); };
    var unlock = function () { if (!cards.some(function (c) { return c.classList.contains("open"); })) cards.forEach(function (c) { if (c.hasAttribute("data-lock")) { c.style.height = ""; c.removeAttribute("data-lock"); } }); };
    var animate = function (card, change) {
      var from = card.offsetHeight;
      card.style.height = from + "px";
      change();
      card.style.height = "auto"; var to = card.offsetHeight; card.style.height = from + "px";
      void card.offsetHeight;
      if (reduce || from === to) { card.style.height = ""; unlock(); return; }
      card.style.height = to + "px";
      var done = function (e) { if (e && e.propertyName !== "height") return; card.removeEventListener("transitionend", done); if (!card.hasAttribute("data-lock")) card.style.height = ""; unlock(); };
      card.addEventListener("transitionend", done);
      setTimeout(done, 700);
    };
    var open = function (card, byKey) {
      if (card.classList.contains("open")) return;
      lock(card);
      var det = $(".cl-sc-d", card), btn = $(".cl-sc-go", card);
      animate(card, function () { card.classList.add("open"); det.hidden = false; btn.setAttribute("aria-expanded", "true"); });
      var x = $(".cl-sc-x", card); if (x && byKey) setTimeout(function () { x.focus({ preventScroll: true }); }, 60);
    };
    var close = function (card, refocus) {
      if (!card.classList.contains("open")) return;
      var det = $(".cl-sc-d", card), btn = $(".cl-sc-go", card);
      animate(card, function () { card.classList.remove("open"); det.hidden = true; btn.setAttribute("aria-expanded", "false"); });
      if (refocus) btn.focus({ preventScroll: true });
    };
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.stopPropagation();
        if (e.target.closest(".cl-sc-d a")) return;                  /* real links inside the details keep working */
        if (e.target.closest(".cl-sc-x")) { close(card, e.detail === 0); return; }   /* refocus only for keyboard users: no stray ring after a mouse click */
        open(card, e.detail === 0);
      });
      card.addEventListener("keydown", function (e) { if (e.key === "Escape" && card.classList.contains("open")) { e.stopPropagation(); close(card, true); } });
    });
    var w = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === w) return; w = window.innerWidth;
      cards.forEach(function (c) { c.classList.remove("open"); c.style.height = ""; c.removeAttribute("data-lock"); var d = $(".cl-sc-d", c); if (d) d.hidden = true; var b = $(".cl-sc-go", c); if (b) b.setAttribute("aria-expanded", "false"); });
    });
  });

  /* ---------- image-swap list: the active row swaps the visual ---------- */
  $$("[data-why]").forEach(function (why) {
    var wrs = $$(".cl-wr", why), wps = $$(".cl-wp", why);
    var setWhy = function (i) {
      wrs.forEach(function (r, k) { r.classList.toggle("on", k === i); });
      wps.forEach(function (m, k) { m.classList.toggle("on", k === i); });
    };
    if ("IntersectionObserver" in window) {
      var wio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && desk()) setWhy(+e.target.dataset.i); });
      }, { rootMargin: "-45% 0px -45% 0px" });
      wrs.forEach(function (r) { wio.observe(r); });
    }
    wrs.forEach(function (r) {
      r.addEventListener("focus", function () { setWhy(+r.dataset.i); });
      r.addEventListener("mouseenter", function () { if (desk()) setWhy(+r.dataset.i); });
      r.addEventListener("click", function () { setWhy(+r.dataset.i); });
    });
  });

  /* ---------- timeline: active step fills the line and shows its description ---------- */
  var tl = $("#cltl");
  if (tl) {
    var tns = $$(".cl-tn", tl), tds = $$(".cl-td"), fill = $("#cltlf");
    var lineEl = $(".cl-tl-line", tl.parentNode), lastI = 0;
    /* the line runs from the first dot to the last dot; the fill ends on the centre of the active dot (measured, so it is exact at any width) */
    var fitFill = function (i) {
      lastI = i; if (!fill || !lineEl) return;
      var d = $(".cl-tn-dot", tns[i]); if (!d || !lineEl.offsetWidth) return;
      var c = d.getBoundingClientRect(), l = lineEl.getBoundingClientRect();
      fill.style.width = Math.max(0, Math.round(c.left + c.width / 2 - l.left)) + "px";
    };
    var setTn = function (i) {
      tns.forEach(function (x, k) { x.classList.toggle("on", k === i); x.classList.toggle("done", k < i); x.setAttribute("aria-pressed", String(k === i)); });
      tds.forEach(function (x, k) { x.classList.toggle("on", k === i); });
      if (fill) fitFill(i);
    };
    /* auto-play: walks the three steps while the timeline is on screen; stops for good once the visitor interacts */
    var cur = 0, auto = !reduce, held = false, ptimer = 0;
    var stopAuto = function () { auto = false; clearInterval(ptimer); };
    var inView = function () { var r = tl.getBoundingClientRect(); return r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.15; };
    var tick = function () { if (auto && !held && desk() && inView()) setTn((cur + 1) % tns.length); };
    var setTnRaw = setTn; setTn = function (i) { cur = i; setTnRaw(i); };
    if (auto) ptimer = setInterval(tick, 4200);
    var wrap = tl.parentNode;
    wrap.addEventListener("mouseenter", function () { held = true; });
    wrap.addEventListener("mouseleave", function () { held = false; });
    tns.forEach(function (it, i) {
      it.addEventListener("mouseenter", function () { if (desk()) setTn(i); });
      it.addEventListener("focus", function () { stopAuto(); setTn(i); });
      it.addEventListener("click", function () { stopAuto(); setTn(i); });
      it.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTn(i); }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); tns[(i + 1) % tns.length].focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); tns[(i - 1 + tns.length) % tns.length].focus(); }
      });
    });
    var sizeLine = function () {
      if (!lineEl || !desk()) return;
      var a = $(".cl-tn-dot", tns[0]).getBoundingClientRect(), b = $(".cl-tn-dot", tns[tns.length - 1]).getBoundingClientRect(), w = lineEl.parentNode.getBoundingClientRect();
      lineEl.style.left = Math.round(a.left + a.width / 2 - w.left) + "px"; lineEl.style.right = Math.round(w.right - (b.left + b.width / 2)) + "px";
      fitFill(lastI);
    };
    window.addEventListener("resize", sizeLine);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(sizeLine);
    if (lineEl) lineEl.addEventListener("click", function (e) {     /* click anywhere on the line: jump to the nearest step */
      var best = 0, bd = 1e9; stopAuto();
      tns.forEach(function (x, k) { var r = $(".cl-tn-dot", x).getBoundingClientRect(), dd = Math.abs(e.clientX - (r.left + r.width / 2)); if (dd < bd) { bd = dd; best = k; } });
      setTn(best);
    });
    setTn(0); sizeLine();
    var sto = 0;   /* mobile: the card nearest the left edge is active */
    tl.addEventListener("scroll", function () {
      if (desk()) return;
      clearTimeout(sto);
      sto = setTimeout(function () {
        var lr = tl.getBoundingClientRect().left, best = 0, bd = 1e9;
        tns.forEach(function (x, k) { var dd = Math.abs(x.getBoundingClientRect().left - lr - 20); if (dd < bd) { bd = dd; best = k; } });
        setTn(best);
      }, 80);
    }, { passive: true });
  }

  /* ---------- stories: one at a time, auto-rotating, paused on hover/focus ---------- */
  var st = $("[data-stories]");
  if (st) {
    var qs = $$(".cl-q", st), qc = $("#clqc"), qi = 0, timer = 0, held = false, seen = false;
    var showQ = function (i) {
      qi = (i + qs.length) % qs.length;
      qs.forEach(function (q, k) { q.classList.toggle("on", k === qi); });
      if (qc) qc.textContent = "0" + (qi + 1);
      var bar = $(".cl-qbar", st);
      if (bar) { bar.classList.remove("run"); void bar.offsetWidth; if (!reduce) bar.classList.add("run"); }
    };
    var arm = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!held && seen && !d.hidden) showQ(qi + 1); }, 8000); };
    $$(".cl-qb", st).forEach(function (b) { b.addEventListener("click", function () { showQ(qi + +b.dataset.d); arm(); }); });
    st.addEventListener("mouseenter", function () { held = true; });
    st.addEventListener("mouseleave", function () { held = false; });
    st.addEventListener("focusin", function () { held = true; });
    st.addEventListener("focusout", function () { held = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.3 }).observe(st);
    arm(); showQ(0);
  }


  /* ---------- principle cards: soft spotlight follows the pointer ---------- */
  $$(".cl-pr > div").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- FAQ accordion: one open per group, heights follow the viewport ---------- */
  function faqSet(item, open) {
    var q = $(".faq-q", item), a = $(".faq-a", item);
    item.classList.toggle("open", open);
    q.setAttribute("aria-expanded", String(open));
    a.style.maxHeight = open ? a.scrollHeight + "px" : null;
  }
  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item"), open = !item.classList.contains("open");
      if (open) $$(".faq-item.open", item.parentNode).forEach(function (o) { if (o !== item) faqSet(o, false); });
      faqSet(item, open);
    });
  });
  var faqFit = function () { $$(".faq-item.open .faq-a").forEach(function (a) { a.style.maxHeight = a.scrollHeight + "px"; }); };
  faqFit(); window.addEventListener("resize", faqFit);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(faqFit);

  /* ---------- footer year ---------- */
  var y = $("#year"); if (y) y.textContent = String(new Date().getFullYear());
})();


/* ---- Before / With TechCares: practice tabs ---- */
(function () {
  var root = document.querySelector("[data-vs]"); if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll(".cl-vs-tab")), panels = [].slice.call(root.querySelectorAll(".cl-vs-panel"));
  function show(i, focus) {
    tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach(function (p, k) {
      p.hidden = k !== i;
      if (k === i) {
        var r = [].slice.call(p.querySelectorAll(".cl-vs-r")); r.forEach(function (x) { x.classList.remove("in"); });
        requestAnimationFrame(function () { requestAnimationFrame(function () { r.forEach(function (x) { x.classList.add("in"); }); }); });
      }
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { show(i); });
    t.addEventListener("keydown", function (e) {
      var k = e.key; if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
      e.preventDefault(); show(k === "Home" ? 0 : k === "End" ? tabs.length - 1 : (i + (k === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length, true);
    });
  });
})();


/* ---- Lead form: hands the enquiry to WhatsApp, pre-filled ----
   Same destination and message format as before. The form is honest about what it did:
   it opens WhatsApp; the visitor sends the message there. Fallbacks: a plain WhatsApp link
   shown if the browser blocks the new tab. */
(function () {
  var form = document.querySelector("[data-lead-form]");
  if (!form) return;
  var PHONE = "917645839971";
  var btn = form.querySelector("[data-lead-submit]");
  var label = form.querySelector("[data-lead-label]");
  var status = form.querySelector("[data-lead-status]");
  var note = form.querySelector("[data-lead-note]");
  var idle = label.textContent, busy = false, unlockTimer = null;

  /* arriving from a practice page (index.html?interest=it#get-started) preselects that practice */
  try {
    var want = { healthcare: "Healthcare Solutions", it: "IT Solutions", both: "Both" }[new URLSearchParams(location.search).get("interest")];
    if (want) Array.prototype.forEach.call(form.elements.interest, function (r) { if (r.value === want) r.checked = true; });
  } catch (e) {}

  var wrapOf = function (el) { return el.closest("[data-field]"); };
  var setErr = function (key, msg) {
    var wrap = form.querySelector('[data-field="' + key + '"]');
    var err = wrap.querySelector(".field-err");
    var input = wrap.querySelector("input:not([type=radio]), textarea");
    wrap.classList.toggle("is-invalid", !!msg);
    err.hidden = !msg; err.textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (key === "interest") wrap.setAttribute("aria-invalid", msg ? "true" : "false");
  };
  var check = {
    interest: function () { return form.elements.interest.value ? "" : "Choose Healthcare, IT, or both."; },
    name: function () { return form.elements.name.value.trim() ? "" : "Enter your name."; },
    email: function () {
      var v = form.elements.email.value.trim();
      if (!v) return "Enter your work email.";
      return /^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email, like jane@company.com.";
    }
  };
  var order = ["interest", "name", "email"];
  var focusField = function (key) {
    var wrap = form.querySelector('[data-field="' + key + '"]');
    var t = key === "interest" ? wrap.querySelector("input") : wrap.querySelector("input, textarea");
    if (t) t.focus();
  };
  var showStatus = function (kind, html) {
    status.className = "close-status is-" + kind;
    status.innerHTML = html; status.hidden = false;
  };
  var clearStatus = function () { status.hidden = true; status.innerHTML = ""; };

  /* live feedback: validate a field once the visitor leaves it, clear its error as they fix it */
  ["name", "email"].forEach(function (k) {
    var el = form.elements[k];
    el.addEventListener("blur", function () { if (el.value) setErr(k, check[k]()); });
    el.addEventListener("input", function () { if (wrapOf(el).classList.contains("is-invalid")) setErr(k, check[k]()); });
  });
  Array.prototype.forEach.call(form.elements.interest, function (r) {
    r.addEventListener("change", function () { setErr("interest", ""); });
  });

  var lock = function (on) {
    busy = on; btn.disabled = on;
    if (on) btn.setAttribute("aria-busy", "true"); else btn.removeAttribute("aria-busy");
    btn.classList.toggle("is-loading", on);
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;                                   /* no duplicate submissions while one is in flight */
    clearStatus();
    var firstBad = null;
    order.forEach(function (k) { var m = check[k](); setErr(k, m); if (m && !firstBad) firstBad = k; });
    if (firstBad) {
      showStatus("error", "<strong>Please fix the highlighted fields.</strong> What you entered is still here.");
      focusField(firstBad);
      return;
    }
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    var interest = form.elements.interest.value, msg = form.elements.msg.value.trim();
    var text = "Hi TechCares, I'm " + name + " (" + email + "). I'm interested in: " + interest + "." + (msg ? " " + msg : "");
    var waUrl = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
    var fallbacks = '<a href="' + waUrl + '" target="_blank" rel="noopener">Open WhatsApp</a>.';

    lock(true); label.textContent = "Opening WhatsApp…";
    var w = null;
    try { w = window.open(waUrl, "_blank"); if (w) w.opener = null; } catch (err) { w = null; }
    if (w) {
      showStatus("success", "<strong>WhatsApp is open with your message ready.</strong> Press send there to reach our team. Didn’t open? " + fallbacks);
    } else {
      showStatus("error", "<strong>Your browser blocked WhatsApp, so nothing has been sent.</strong> Your details are still here. " + fallbacks);
    }
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(function () {
      lock(false); label.textContent = w ? "Open WhatsApp again" : "Try again";
    }, 3000);
  });

  /* editing after a result means the next press is a fresh attempt */
  form.addEventListener("input", function () { if (!busy) label.textContent = idle; });
})();

