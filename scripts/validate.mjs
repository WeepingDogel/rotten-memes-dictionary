#!/usr/bin/env node
// 烂梗词典 · 数据校验（零依赖）：检查 data/entries.js 与 vocab.json 是否一致。
// 用法：node scripts/validate.mjs   （本地 / CI 都会跑）
// 失败：打印所有问题并以退出码 1 结束。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const entriesSrc = read("data/entries.js");
const m = entriesSrc.match(/window\.ROT_ENTRIES\s*=\s*([\s\S]*?);\s*$/);
if (!m) { console.error("✗ 没能在 data/entries.js 找到 window.ROT_ENTRIES"); process.exit(1); }
let entries;
try { entries = JSON.parse(m[1]); }
catch (e) { console.error("✗ entries.js 里的 JSON 解析失败:", e.message); process.exit(1); }

const vocab = JSON.parse(read("data/vocab.json"));
const K = { category: "categories", status: "statuses", tone: "tones" };
const REQUIRED = ["id", "term", "meaning", "category", "harm_note", "harm_level"];
const problems = [];

const ids = entries.map((e) => e.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) problems.push("重复 id: " + dup.join(", "));
if (!entries.length) problems.push("entries 为空");

for (const e of entries) {
  const id = e.id || "(无id)";
  for (const k of REQUIRED) if (e[k] === undefined || e[k] === null || e[k] === "") problems.push(`${id}: 缺 ${k}`);
  for (const [k, vk] of Object.entries(K)) if (e[k] && !vocab[vk].includes(e[k])) problems.push(`${id}: ${k}=${e[k]} 不在词表`);
  for (const h of e.harm_tags || []) if (!vocab.harm_tags.includes(h)) problems.push(`${id}: harm_tag=${h} 不在词表`);
  if (!Array.isArray(e.harm_tags) || !e.harm_tags.length) problems.push(`${id}: harm_tags 至少要一个`);
  if (!Number.isInteger(e.harm_level) || e.harm_level < 1 || e.harm_level > 5) problems.push(`${id}: harm_level 越界`);
}

if (problems.length) {
  console.error("✗ " + problems.length + " 个问题:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ 通过：${entries.length} 条词条，id 唯一、必填齐全、枚举都在词表内。`);
