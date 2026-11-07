# 烂梗词典 rotten-memes-dictionary

把小学生/青少年满嘴的“烂梗”整理成一本**可查询、可解释、也讲危害**的词典。

每个词条不只告诉你“它是什么意思”，还告诉你：

- 它**从哪来**（来源/出处）
- **小孩典型怎么用的**
- **为什么有害**（对表达能力的具体伤害 + 危害等级 1–5）
- 更好的**替代说法**思路（见 [为什么满嘴烂梗是问题](https://github.com/WeepingDogel/rotten-memes-dictionary#indexwhy)）

纯前端：零依赖、零构建，`index.html` 直接开、GitHub Pages 直接分享。

## 目录

| 文件 | 作用 |
|---|---|
| `index.html` | 站点入口（含静态的“危害科普”） |
| `app.js` | 检索、筛选、卡片、危害分布逻辑 |
| `style.css` | 样式（浅色/深色自动） |
| `data/entries.js` | **词源**：所有词条（`window.ROT_ENTRIES`） |
| `data/vocab.json` | 受控词表（分类 / 危害标签 / 现势 / 情感色彩） |
| `data/schema.json` | 词条 JSON Schema（贡献校验用） |

## 如何贡献一条（零门槛）

1. 打开 `data/entries.js`，在 `window.ROT_ENTRIES = [ ... ]` 数组里**仿照现有条目**加一段：

   ```json
   {
     "id": "kebab-case-唯一", "term": "绝绝子", "aliases": ["绝了"],
     "category": "网络黑话", "meaning": "现在常用义。",
     "origin": "来源/出处（不确定就写“来源有争议”）。",
     "example": ["例句1。"], "kid_usage": "小学生的典型用法。",
     "first_seen": "2021", "status": "active", "tone": "贬义",
     "harm_tags": ["表达退化"], "harm_note": "它具体怎么伤到表达。",
     "harm_level": 4, "contributors": ["你的GitHub名"]
   }
   ```

2. `category` / `status` / `tone` / `harm_tags` 必须是 `data/vocab.json` 里已有的取值，否则页面筛选会对不上。
3. `harm_level` 取 1–5。提交 PR 即可。

> 规则：意思可考（拿不准就标注“来源有争议”）；危害必须落到**表达能力的具体损失**，不要空喊“有害”。

## 本地打开

直接双击 `index.html`，或：

```bash
python3 -m http.server 8000   # 然后开 http://localhost:8000
```

## 仓库约定

- 数据唯一来源是 `data/entries.js`（内嵌全局对象，站点不 fetch，`file://` 也能跑）。
- 新增词条请补全 `contributors`，方便追溯。
