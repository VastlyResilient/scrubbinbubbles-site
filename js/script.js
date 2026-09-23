/* Scrubbin' Bubbles motion system. Policy: the Pause-motion button is the ONLY off-switch
   (persists in localStorage). prefers-reduced-motion calms: 200ms opacity reveals,
   half-speed video, never a freeze. Transform/opacity only; none on prices, hours, phones, forms. */
(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motionOff = localStorage.getItem("sb-motion") === "off";
  var root = document.documentElement;
  root.classList.toggle("motion-off", motionOff);

  function tryPlay(v){ var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  var vids = [].slice.call(document.querySelectorAll("video"));

  function applyMotion(){
    vids.forEach(function(v){
      v.loop = true;
      v.playbackRate = reduce ? 0.5 : 1;
      if (motionOff) { v.pause(); }
    });
  }

  /* play only while on screen */
  if ("IntersectionObserver" in window) {
    vids.forEach(function(v){
      new IntersectionObserver(function(en){
        en.forEach(function(e){
          if (motionOff) { v.pause(); return; }
          if (e.isIntersecting) tryPlay(v); else v.pause();
        });
      }, {threshold: 0.05}).observe(v);
    });
  }
  applyMotion();

  /* pause-motion toggle: the single off-switch */
  var btn = document.getElementById("motionToggle");
  function syncBtn(){
    if (!btn) return;
    btn.textContent = motionOff ? "Resume motion" : "Pause motion";
    btn.setAttribute("aria-pressed", motionOff ? "true" : "false");
    root.classList.toggle("motion-off", motionOff);
  }
  if (btn) {
    syncBtn();
    btn.addEventListener("click", function(){
      motionOff = !motionOff;
      localStorage.setItem("sb-motion", motionOff ? "off" : "on");
      syncBtn();
      applyMotion();
      if (motionOff) {
        document.querySelectorAll(".reveal,.rise,.mask-in").forEach(function(el){ el.classList.add("is-in"); });
      } else {
        vids.forEach(function(v){ tryPlay(v); });
      }
    });
  }

  /* mobile menu */
  var menuBtn = document.getElementById("menuBtn");
  var panel = document.getElementById("mobilePanel");
  if (menuBtn && panel) {
    menuBtn.addEventListener("click", function(){
      var open = panel.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Menu";
    });
    panel.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        panel.classList.remove("open");
        menuBtn.setAttribute("aria-expanded","false");
        menuBtn.textContent = "Menu";
      });
    });
  }

  /* header state after 80px */
  var head = document.querySelector(".site-head");
  function onScroll(){ if (head) head.classList.toggle("scrolled", window.scrollY > 80); }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* lazy map iframes */
  document.querySelectorAll("iframe[data-src]").forEach(function(f){
    if (!("IntersectionObserver" in window)) { f.src = f.getAttribute("data-src"); return; }
    new IntersectionObserver(function(en, o){
      en.forEach(function(e){
        if (e.isIntersecting) { f.src = f.getAttribute("data-src"); o.unobserve(f); }
      });
    }, {rootMargin: "400px"}).observe(f);
  });

  if (motionOff || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal,.rise,.mask-in").forEach(function(el){ el.classList.add("is-in"); });
    return;
  }

  /* masked headline lines: observe the heading, stagger its lines 80ms */
  document.querySelectorAll("[data-mask]").forEach(function(h){
    var lines = h.querySelectorAll(".mask-in");
    lines.forEach(function(l, i){ l.style.transitionDelay = (i * 80) + "ms"; });
    new IntersectionObserver(function(en, o){
      en.forEach(function(e){
        if (e.isIntersecting) { h.classList.add("is-in"); o.unobserve(h); }
      });
    }, {rootMargin: "0px 0px -20% 0px", threshold: 0}).observe(h);
  });

  /* card rises: stagger 100ms within each group, observed at the section */
  document.querySelectorAll("[data-rises]").forEach(function(g){
    [].slice.call(g.querySelectorAll(".rise")).forEach(function(el, i){
      el.style.transitionDelay = (i * 100) + "ms";
    });
  });

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, {rootMargin: "0px 0px -20% 0px", threshold: 0.05});
  document.querySelectorAll(".reveal, .rise").forEach(function(el){ io.observe(el); });

  /* count-up: sourced numbers only, 1200ms ease-out; final value lives in the HTML */
  document.querySelectorAll("[data-count]").forEach(function(b){
    if (reduce) return; /* calm: final value already in place */
    new IntersectionObserver(function(en, o){
      en.forEach(function(e){
        if (!e.isIntersecting) return;
        o.unobserve(b);
        var end = parseInt(b.getAttribute("data-count"), 10);
        var suffix = b.getAttribute("data-suffix") || "";
        var t0 = null;
        function tick(t){
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          b.textContent = Math.round(end * eased) + (p === 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
          else b.textContent = end + suffix;
        }
        requestAnimationFrame(tick);
      });
    }, {threshold: 0.4}).observe(b);
  });
})();
