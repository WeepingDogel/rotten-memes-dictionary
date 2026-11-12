// 烂梗词典 · 纯前端逻辑（零依赖）—— 牛津词典风格：检索优先 + 单条词条 + 浏览/结果侧栏
(function () {
  "use strict";
  const DATA = window.ROT_ENTRIES || [];
  const $ = (s) => document.querySelector(s);
  const q = $("#q"), randomBtn = $("#random"), entry = $("#entry"), side = $("#side"),
        statblocks = $("#statblocks"), pillcount = $("#pillcount"), footcount = $("#footcount");

  const uniq = (a) => Array.from(new Set(a));
  const norm = (s) => (s || "").toLowerCase();
  const STATUS = { active: "在用", fading: "退潮中", dead: "已退场" };

  let query = "";
  let currentId = null;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  // 高亮查询词
  function hi(s) {
    s = String(s);
    if (!query) return esc(s);
    const terms = query.split(/\s+/).filter(Boolean);
    const safe = esc(s);
    if (!terms.length) return safe;
    const re = new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }
  function match(e) {
    if (!query) return true;
    const hay = [e.term, e.pinyin, e.meaning, e.harm_note,
      (e.aliases || []).join(" "), (e.topics || []).join(" ")]
      .map(norm).join(" ");
    return query.split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  }
  function byHarm(a, b) { return b.harm_level - a.harm_level || a.term.localeCompare(b.term, "zh"); }

  // 词条正文（牛津词条结构）
  function entryHTML(e) {
    const speak = ("speechSynthesis" in window)
      ? '<button class="speak" data-t="' + esc(e.term) + '" title="朗读">🔊</button>' : "";
    const ipa = e.pinyin ? '<span class="ipa">/' + hi(e.pinyin) + "/</span>" : "";
    const labels = '<span class="pos">' + esc(e.category) + "</span>" +
      (e.tone ? ' <span class="tag tone-' + esc(e.tone) + '">' + esc(e.tone) + "</span>" : "") +
      ' <span class="tag stat-' + e.status + '">' + (STATUS[e.status] || e.status) + "</span>";
    const also = [
      (e.aliases && e.aliases.length) ? '<span class="kw">也作</span> ' + e.aliases.map((a) => "<b>" + hi(a) + "</b>").join(" ") : "",
      (e.topics && e.topics.length) ? e.topics.map((t) => '<span class="kw topic">' + esc(t) + "</span>").join(" ") : ""
    ].filter(Boolean).join("  ·  ");
    const exs = (e.example || []).map((x) => "<li>" + hi(x) + "</li>").join("");
    return (
      '<div class="entry-head">' +
        '<div class="eh1"><h1 class="headword">' + hi(e.term) + "</h1>" + speak +
          '<span class="harm h'+e.harm_level+'" title="危害等级 '+e.harm_level+'/5">危害 '+e.harm_level+'/5</span></div>' +
        '<div class="pron">' + ipa + labels + "</div>" +
        (also ? '<div class="also">' + also + "</div>" : "") +
      "</div>" +
      '<div class="sense"><span class="sno">1</span><p class="sdef">' + hi(e.meaning) + "</p></div>" +
      (e.origin ? '<p class="ety"><span class="lb">Etymology · 来源</span>' + hi(e.origin) + "</p>" : "") +
      (exs ? '<div class="exb"><span class="lb">Example · 例句</span><ul>' + exs + "</ul></div>" : "") +
      (e.kid_usage ? '<p class="usage"><span class="lb">Usage · 小孩典型用法</span>' + hi(e.kid_usage) + "</p>" : "") +
      '<div class="caution"><span class="caut-h">Caution · 用法注意</span>' +
        '<div class="htags">' + e.harm_tags.map((h) => "<span>" + hi(h) + "</span>").join("") + "</div>" +
        "<p>" + hi(e.harm_note) + "</p></div>" +
      (e.first_seen ? '<p class="meta">约 ' + esc(e.first_seen) + " 年前后流行 · 贡献：" +
        ((e.contributors && e.contributors.length) ? e.contributors.map(esc).join("、") : "—") + "</p>" : "")
    );
  }

  // 侧栏：有查询→结果列表；无→按类浏览
  function sideHTML() {
    if (query) {
      const res = DATA.filter(match).sort(byHarm);
      if (!res.length) return '<div class="side empty">没有匹配「' + hi(query) + "」的词条。</div>";
      return '<div class="side-res"><div class="side-h">相关词条 · ' + res.length + "</div>" + res.map((e) =>
        '<button class="res" data-id="' + e.id + '"><b>' + hi(e.term) + "</b>" +
        (e.pinyin ? ' <i>/' + esc(e.pinyin) + "/</i>" : "") +
        '<span class="rmean">' + esc((e.meaning || "").slice(0, 24)) + "…</span></button>"
      ).join("") + "</div>";
    }
    const groups = {};
    DATA.forEach((e) => { (groups[e.category] = groups[e.category] || []).push(e); });
    const cats = Object.keys(groups).sort();
    return '<div class="side-browse"><div class="side-h">按类浏览 · 全部 ' + DATA.length + " 条</div>" +
      cats.map((c) =>
        '<div class="cat"><div class="cat-h">' + esc(c) + " <span>" + groups[c].length + "</span></div>" +
        '<div class="cat-w">' + groups[c].map((e) =>
          '<button class="w" data-id="' + e.id + '">' + esc(e.term) + "</button>").join("") + "</div></div>"
      ).join("") + "</div>";
  }

  function pickCurrent() {
    if (query) {
      const res = DATA.filter(match).sort(byHarm);
      if (res.length) {
        return res.find((e) => e.term.toLowerCase() === query) ||
          res.find((e) => (e.aliases || []).map(norm).includes(norm(query))) || res[0];
      }
    }
    if (currentId) { const c = DATA.find((e) => e.id === currentId); if (c) return c; }
    return DATA[Math.floor(Math.random() * DATA.length)]; // 默认：今日烂梗（随机）
  }

  function render(animate) {
    const cur = pickCurrent();
    currentId = cur.id;
    entry.innerHTML = entryHTML(cur);
    side.innerHTML = sideHTML();
    entry.dispatchEvent(new CustomEvent("rot-render", { detail: { animate: !!animate } }));
  }

  function select(id) { currentId = id; query = ""; q.value = ""; render(true); }

  // 交互
  q.addEventListener("input", () => { query = norm(q.value); render(false); });
  randomBtn.addEventListener("click", () => {
    currentId = DATA[Math.floor(Math.random() * DATA.length)].id;
    query = ""; q.value = ""; render(true);
  });
  side.addEventListener("click", (ev) => { const b = ev.target.closest("[data-id]"); if (b) select(b.dataset.id); });
  entry.addEventListener("click", (ev) => {
    const s = ev.target.closest(".speak");
    if (!s || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(s.dataset.t); u.lang = "zh-CN"; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => /zh|Chinese/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  });

  // 危害分布（统计块）
  const harmSet = uniq(DATA.flatMap((e) => e.harm_tags)).sort();
  const catSet = uniq(DATA.map((e) => e.category)).sort();
  (function stats() {
    const hCount = harmSet.map((h) => [h, DATA.filter((e) => e.harm_tags.includes(h)).length]).sort((a, b) => b[1] - a[1]);
    const maxH = hCount[0] ? hCount[0][1] : 1;
    const hBars = hCount.map(([h, n]) =>
      '<div class="bar"><span class="bl">' + esc(h) + '</span><span class="track"><i style="width:' +
      Math.round(n / maxH * 100) + '%"></i></span><b>' + n + "</b></div>").join("");
    const cCount = catSet.map((c) => [c, DATA.filter((e) => e.category === c).length]).sort((a, b) => b[1] - a[1]);
    const cBars = cCount.map(([c, n]) => '<div class="kv"><b>' + esc(c) + "</b> " + n + " 条</div>").join("");
    const top = DATA.filter((e) => e.harm_level >= 4).sort(byHarm)
      .map((e) => '<li><button class="w" data-id="' + e.id + '">' + esc(e.term) + "</button>（" + e.harm_level + "）</li>").join("");
    statblocks.innerHTML =
      '<div class="sgrid">' +
        '<div class="sbox"><h4>哪种伤害最常见</h4>' + hBars + "</div>" +
        '<div class="sbox"><h4>分类分布</h4>' + cBars + "</div>" +
        '<div class="sbox"><h4>危害 ≥ 4 · 建议优先纠正</h4><ol class="top">' + (top || "<li>当前没有 ≥4</li>") + "</ol></div>" +
      "</div>";
    statblocks.addEventListener("click", (ev) => { const b = ev.target.closest("[data-id]"); if (b) { location.hash = "#index"; select(b.dataset.id); } });
  })();

  pillcount.textContent = DATA.length;
  footcount.textContent = DATA.length;
  render(true); // 首屏：随机一条 + 浏览索引
})();
