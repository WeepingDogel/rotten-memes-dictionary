// 烂梗词典 · 纯前端逻辑（零依赖）
(function () {
  "use strict";
  const DATA = window.ROT_ENTRIES || [];

  const $ = (s) => document.querySelector(s);
  const cats = $("#cats"), harms = $("#harms"), topics = $("#topics"),
        list = $("#list"), q = $("#q"), empty = $("#empty"), count = $("#count"),
        only4 = $("#only4"), byname = $("#byname"),
        pillcount = $("#pillcount"), footcount = $("#footcount"),
        statblocks = $("#statblocks");

  // 唯一值集合（从数据推导，始终一致）
  const uniq = (arr) => Array.from(new Set(arr));
  const catSet = uniq(DATA.map((e) => e.category)).sort();
  const harmSet = uniq(DATA.flatMap((e) => e.harm_tags)).sort();
  const topicSet = uniq(DATA.flatMap((e) => e.topics || [])).sort();

  // 选中态
  const selCat = new Set(), selHarm = new Set(), selTopics = new Set();
  let query = "";

  const norm = (s) => (s || "").toLowerCase();

  // 命中查询？term / aliases / pinyin / meaning / harm_note / topics
  function match(e) {
    if (!query) return true;
    const hay = [e.term, e.pinyin, e.meaning, e.harm_note,
      (e.aliases || []).join(" "), (e.topics || []).join(" ")]
      .map(norm).join(" ");
    return query.split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  }

  function passFilters(e) {
    if (only4.checked && e.harm_level < 4) return false;
    if (selCat.size && !selCat.has(e.category)) return false;
    if (selHarm.size && !e.harm_tags.some((h) => selHarm.has(h))) return false;
    if (selTopics.size && !(e.topics || []).some((t) => selTopics.has(t))) return false;
    return true;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  // 高亮查询词
  function hi(s) {
    if (!query) return esc(s);
    const safe = esc(s);
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) return safe;
    const re = new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function meter(level) {
    let s = '<span class="meter" title="危害等级 ' + level + '/5">';
    for (let i = 1; i <= 5; i++) s += '<i class="' + (i <= level ? "on" : "") + '"></i>';
    return s + "</span>";
  }

  function badge(text, cls) {
    return text ? '<span class="badge ' + (cls || "") + '">' + esc(text) + "</span>" : "";
  }

  function card(e) {
    const ex = (e.example || []).map((x) => '<li>' + hi(x) + "</li>").join("");
    const more = [
      e.origin ? '<div class="kv"><b>来源</b>' + hi(e.origin) + "</div>" : "",
      e.kid_usage ? '<div class="kv"><b>小孩典型用法</b>' + hi(e.kid_usage) + "</div>" : "",
      (e.aliases && e.aliases.length) ? '<div class="kv"><b>别名</b>' + hi(e.aliases.join("、")) + "</div>" : "",
      e.pinyin ? '<div class="kv"><b>拼音</b>' + hi(e.pinyin) + "</div>" : "",
      e.first_seen ? '<div class="kv"><b>流行</b>' + esc(e.first_seen) + " 前后</div>" : "",
    ].join("");
    const harms2 = e.harm_tags.map((h) => '<span class="htag">' + hi(h) + "</span>").join(" ");
    const tps = (e.topics || []).length
      ? '<div class="ctopics">' + e.topics.map((t) => '<span class="tbadge">' + hi(t) + "</span>").join("") + "</div>" : "";
    return '<article class="card">' +
      '<div class="c-top">' +
        '<h3 class="term">' + hi(e.term) + "</h3>" +
        meter(e.harm_level) +
        '<div class="tags">' +
          badge(e.category, "cat") +
          badge(e.tone, "tone-" + (e.tone || "中性").replace(/[^\u4e00-\u9fa5]/g, "")) +
          badge(e.status, "stat-" + e.status) +
        "</div>" +
      "</div>" +
      '<p class="meaning">' + hi(e.meaning) + "</p>" +
      '<div class="harm"><span class="hlab">危害</span>' + harms2 +
        '<p>' + hi(e.harm_note) + "</p></div>" +
      tps +
      (ex ? '<ul class="ex">' + ex + "</ul>" : "") +
      (more ? '<details class="more"><summary>更多（来源/用法/别名/拼音/时间）</summary>' + more + "</details>" : "") +
      "</article>";
  }

  function render(animate) {
    const shown = DATA.filter((e) => match(e) && passFilters(e));
    if (byname.checked) shown.sort((a, b) => a.term.localeCompare(b.term, "zh"));
    else shown.sort((a, b) => (b.harm_level - a.harm_level) || a.term.localeCompare(b.term, "zh"));
    list.innerHTML = shown.map(card).join("");
    empty.hidden = shown.length !== 0;
    count.textContent = "共 " + DATA.length + " 条，当前显示 " + shown.length + " 条";
    list.dispatchEvent(new CustomEvent("rot-render", { detail: { animate: !!animate } }));
  }

  function chips(container, items, set, has) {
    has = has || ((e, c) => e.category === c || e.harm_tags.includes(c));
    container.innerHTML = items.map((c) => {
      const n = DATA.filter((e) => has(e, c)).length;
      return '<button class="chip" data-v="' + esc(c) + '">' + hi(c) +
        ' <span class="n">' + n + "</span></button>";
    }).join("");
    container.querySelectorAll(".chip").forEach((btn) =>
      btn.addEventListener("click", () => {
        const v = btn.dataset.v;
        set.has(v) ? set.delete(v) : set.add(v);
        btn.classList.toggle("on", set.has(v));
        render(true);
      }));
  }

  // 危害分布：标签计数 + 分类计数 + 高危害榜
  function stats() {
    const hCount = harmSet.map((h) => [h, DATA.filter((e) => e.harm_tags.includes(h)).length])
      .sort((a, b) => b[1] - a[1]);
    const maxH = hCount[0] ? hCount[0][1] : 1;
    const hBars = hCount.map(([h, n]) =>
      '<div class="bar"><span class="bl">' + esc(h) + "</span>" +
      '<span class="track"><i style="width:' + Math.round(n / maxH * 100) + '%"></i></span>' +
      '<b>' + n + "</b></div>").join("");

    const cCount = catSet.map((c) => [c, DATA.filter((e) => e.category === c).length])
      .sort((a, b) => b[1] - a[1]);
    const cBars = cCount.map(([c, n]) =>
      '<div class="kv"><b>' + esc(c) + "</b> " + n + " 条</div>").join("");

    const top = DATA.filter((e) => e.harm_level >= 4)
      .sort((a, b) => b.harm_level - a.harm_level)
      .map((e) => '<li><b>' + hi(e.term) + "</b>（危害 " + e.harm_level + "）：先纠正它</li>").join("");

    statblocks.innerHTML =
      '<div class="sgrid">' +
        '<div class="sbox"><h4>哪种危害最常见</h4>' + hBars + "</div>" +
        '<div class="sbox"><h4>分类分布</h4>' + cBars + "</div>" +
        '<div class="sbox"><h4>危害 ≥ 4，建议优先纠正</h4><ol class="top">' +
          (top || "<li>当前没有 ≥4 的条目</li>") + "</ol></div>" +
      "</div>";
  }

  // 初始化
  chips(cats, catSet, selCat, (e, c) => e.category === c);
  chips(harms, harmSet, selHarm, (e, c) => e.harm_tags.includes(c));
  if (topicSet.length) chips(topics, topicSet, selTopics, (e, c) => (e.topics || []).includes(c));
  else topics.parentElement.hidden = true;
  q.addEventListener("input", () => { query = norm(q.value); render(false); });
  only4.addEventListener("change", () => render(true));
  byname.addEventListener("change", () => render(true));
  pillcount.textContent = DATA.length;
  footcount.textContent = DATA.length;
  stats();
  render(true);
})();
