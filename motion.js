// 烂梗词典 · GSAP 动效层（可选增强；GSAP 缺失或关闭动效时页面照常可用）
// 依赖：vendor/gsap/gsap.min.js + ScrollTrigger.min.js（自托管，非 CDN）
(function () {
  // 双闸门（skill 硬约束）：减少动效偏好 / GSAP 没加载 → 直接退出，内容保持可见
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  var entry = document.getElementById("entry");

  // 1) 报头入场：品牌 + 检索栏 轻起伏（带“强制完成”安全网）
  var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".masthead", { y: -14, opacity: 0, duration: 0.5 })
    .from(".brand", { y: 10, opacity: 0, duration: 0.4 }, "-=0.2")
    .from(".lookup", { y: 10, opacity: 0, duration: 0.4 }, "-=0.2");
  setTimeout(function () { tl.progress(1); }, 4000);

  // 2) 词条“翻页”：首屏一次 + 每次“离散”切换（rot-render & animate）子块轻错落
  function animateEntry(y) {
    if (!entry || !entry.children.length) return;
    gsap.from(entry.children, {
      opacity: 0, y: y, duration: 0.4, ease: "power2.out", stagger: 0.04,
      clearProps: "transform, opacity"
    });
  }
  animateEntry(16); // 首屏（app.js 已把词条渲染好）
  entry && entry.addEventListener("rot-render", function (e) {
    if (e.detail && e.detail.animate) animateEntry(10);
  });

  // 3) 各章节滚动揭示（.sec）+ 统计条生长 + 顶部进度条（ScrollTrigger）
  if (window.ScrollTrigger) {
    gsap.utils.toArray(".sec").forEach(function (sec) {
      gsap.from(sec, { opacity: 0, y: 30, duration: 0.6, ease: "power3.out",
        scrollTrigger: { trigger: sec, start: "top 88%" } });
    });
    gsap.utils.toArray("#caution .track i").forEach(function (el) {
      gsap.from(el, { width: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: "#caution", start: "top 80%" } });
    });
    var bar = document.getElementById("scrollbar");
    if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 } });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
