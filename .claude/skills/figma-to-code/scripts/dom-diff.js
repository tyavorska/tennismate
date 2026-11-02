// Browser side of the pixel diff. Run it with the browser tool's javascript_exec after
// setting EXPECTED to the rows from figma_metadata_to_rects.py (texts and boxes you care about).
//
// 1. Open the page at the frame's width (resize_window) and set the theme you are checking:
//    document.documentElement.dataset.theme = 'light' | 'dark'  (re-read it after a reload,
//    the saved preference can override it, and iframes keep the saved theme).
// 2. Paste this file with EXPECTED filled in. Each row is [label, kind, key, x, y, w, h]:
//      kind 'text' -> key is the visible text; compares the element box (not the glyph box)
//      kind 'box'  -> key is a CSS selector
// 3. Read the table: dx/dy/dw/dh beyond TOLERANCE are real differences.
//
// Compare element boxes, not Range boxes: a Range returns the font's em box, which sits a
// few pixels off the line box Figma reports and creates false differences.
const TOLERANCE = 1;
const EXPECTED = []; // [label, 'text' | 'box', key, x, y, w, h]

const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const byText = (text) =>
  [...document.querySelectorAll('body *')].find(
    (e) =>
      norm(e.textContent) === norm(text) &&
      ![...e.children].some((c) => norm(c.textContent) === norm(text)),
  );
const rect = (e) => {
  const b = e.getBoundingClientRect();
  return [b.x, b.y + scrollY, b.width, b.height];
};
const rows = EXPECTED.map(([label, kind, key, x, y, w, h]) => {
  const el = kind === 'text' ? byText(key) : document.querySelector(key);
  if (!el) return `${label}\tNOT FOUND`;
  const [ax, ay, aw, ah] = rect(el);
  const d = [ax - x, ay - y, kind === 'box' ? aw - w : 0, ah - h].map(
    (v) => Math.round(v * 10) / 10,
  );
  const bad = d.some((v) => Math.abs(v) > TOLERANCE);
  return `${bad ? 'DIFF' : 'ok  '}\t${label}\tdx ${d[0]}\tdy ${d[1]}\tdw ${d[2]}\tdh ${d[3]}`;
});
// The tool returns the value of the last expression, so it must stay one.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rows.join('\n') + `\npage height ${document.documentElement.scrollHeight}`;
