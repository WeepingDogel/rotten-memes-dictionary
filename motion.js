// 烂梗词典 · GSAP 动效层（可选增强；GSAP 缺失或关闭动效时页面照常可用）
// 依赖：vendor/gsap/gsap.min.js + ScrollTrigger.min.js（自托管，非 CDN）
(function () {
  // 双闸门（skill 硬约束）：减少动效偏好 / GSAP 没加载 → 直接退出，内容保持可见
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  var list = document.getElementById("list");

  // 1) 入场时间线：顶栏 + 标签胶囊 轻起伏，带“强制完成”安全网（后台/限帧 tab 也能落地）
  var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".top", { y: -16, opacity: 0, duration: 0.5 })
    .from(".pill", { opacity: 0, y: 10, stagger: 0.05, duration: 0.4 }, "-=0.25");
  setTimeout(function () { tl.progress(1); }, 4000);

  // 2) 卡片入场：首屏一次 + 之后每次“离散筛选”（rot-render & animate）
  function animateCards(y) {
    var cards = Array.from(list.querySelectorAll(".card"));
    if (!cards.length) return;
    gsap.from(cards, {
      opacity: 0, y: y, duration: 0.45, ease: "power2.out",
      stagger: { each: 0.02, grid: "auto 3", from: "start" },
      clearProps: "transform, opacity"
    });
  }
  if (list) {
    animateCards(18); // 初始（app.js 已把卡片渲染好）
    list.addEventListener("rot-render", function (e) {
      if (e.detail && e.detail.animate) animateCards(10);
    });
  }

  // 3) 各区块滚动揭示（ScrollTrigger）
  if (window.ScrollTrigger) {
    gsap.utils.toArray("section.card-sec").forEach(function (sec) {
      gsap.from(sec, {
        opacity: 0, y: 32, duration: 0.6, ease: "power3.out",
        scrollTrigger: { trigger: sec, start: "top 88%" }
      });
    });
    // 统计条：宽度从 0 生长到内联目标值（保留最终宽度）
    gsap.utils.toArray("#statblocks .track i").forEach(function (el) {
      gsap.from(el, {
        width: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: "#stats", start: "top 80%" }
      });
    });
    // 顶部滚动进度条（#scrollbar，scrub 跟随滚动）
    var bar = document.getElementById("scrollbar");
    if (bar) gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 }
    });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
