(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
  var menuBtn = $(".menu-btn"), nav = $(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- reading progress + back to top ---------- */
  var bar = $(".progress");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var topBtn = $(".to-top");
  if (topBtn) topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- category filter chips (home) ---------- */
  var chips = $$(".chip"), cards = $$(".post-card"), empty = $("#empty");
  function applyFilter(f) {
    var shown = 0;
    chips.forEach(function (c) { c.classList.toggle("active", c.getAttribute("data-filter") === f); });
    cards.forEach(function (card) {
      var cats = (card.getAttribute("data-cats") || "").split(" ");
      var show = f === "all" || cats.indexOf(f) !== -1;
      card.hidden = !show;
      if (show) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
  }
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () { applyFilter(chip.getAttribute("data-filter")); });
  });

  /* ---------- post enhancements ---------- */
  var content = $(".layout-post .post-content");
  if (content) {
    // wrap tables so wide ones scroll instead of breaking the layout
    $$("table", content).forEach(function (t) {
      var w = document.createElement("div");
      w.className = "table-wrap";
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });

    // table of contents + scroll-spy
    var tocNav = $("#toc");
    var heads = $$("h2[id], h3[id]", content);
    if (tocNav && heads.length) {
      var links = heads.map(function (h) {
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        if (h.tagName === "H3") a.className = "l3";
        tocNav.appendChild(a);
        return a;
      });
      if ("IntersectionObserver" in window) {
        var current = null;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var i = heads.indexOf(e.target);
              if (current !== null) links[current].classList.remove("on");
              links[i].classList.add("on");
              current = i;
            }
          });
        }, { rootMargin: "-80px 0px -70% 0px" });
        heads.forEach(function (h) { io.observe(h); });
      }
    } else if (tocNav) {
      var aside = tocNav.closest(".toc");
      if (aside) aside.style.display = "none";
    }
  }

  /* ---------- code blocks: header bar + copy button (all pages) ---------- */
  $$("div.highlighter-rouge").forEach(function (block) {
    var m = /language-([\w+#-]+)/.exec(block.className);
    var lang = m ? m[1] : "text";
    if (lang === "plaintext") lang = "text";

    var head = document.createElement("div");
    head.className = "code-head";
    head.innerHTML = '<span class="lang"><span class="dots"><i></i><i></i><i></i></span>' + lang + "</span>";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var src = $(".rouge-code", block) || $("code", block);
      var text = src ? src.innerText.replace(/\n$/, "") : "";
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("done");
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    head.appendChild(btn);
    block.insertBefore(head, block.firstChild);
  });
})();
