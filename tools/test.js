// 無瀏覽器測試：node tools/test.js
// 用假的 DOM 載入 data.js 與 index.html 內的程式，檢查地圖生成、魔物數值與一趟完整流程。
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

function el() {
  const e = {
    innerHTML: '', textContent: '', value: '', _h: null, scrollTop: 0, dataset: {}, style: {}, width: 480, height: 300,
    classList: { add() {}, remove() {}, contains() { return false; } },
    addEventListener() {}, querySelector() { return null; }, select() {},
    getContext() { return ctx2d; }, toDataURL() { return 'data:,'; },
    closest() { return null; }, remove() {}
  };
  return e;
}
const ctx2d = new Proxy({}, { get(t, k) {
  if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
  if (k in t) return t[k];
  return () => {};
}, set(t, k, v) { t[k] = v; return true; } });
const els = {};
const timers = [];
const store = {};
const sandbox = {
  console, Math, JSON, Object, Array, String, Number, Date, parseInt, parseFloat, isNaN, Error, Float32Array, RegExp,
  document: { getElementById: id => els[id] || (els[id] = el()), createElement: () => el(), addEventListener() {} },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
  requestAnimationFrame() {}, addEventListener() {},
  btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
  unescape, escape, encodeURIComponent, decodeURIComponent
};
sandbox.window = sandbox; sandbox.parent = sandbox;
vm.createContext(sandbox);
function flush() { let n = 0; while (timers.length && n++ < 1000) timers.shift()(); }

vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), sandbox, { filename: 'data.js' });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/<script>\n([\s\S]*?)<\/script>/);
if (!m) throw new Error('找不到內嵌程式');
vm.runInContext(m[1], sandbox, { filename: 'index.html<script>' });

const T = sandbox.__t, D = sandbox.ISK_DATA;
let fail = 0;
function ok(c, msg) { if (!c) { fail++; console.log('  ✗ ' + msg); } }

// 1. 地圖與遭遇
console.log('== 樓層 ==');
for (let f = 1; f < D.FL.length; f++) {
  const cfg = D.FL[f], d = T.fd(f), cap = D.encounterCap(cfg.lv);
  const mons = d.feats.filter(x => x.type === 'mon'), boss = d.feats.filter(x => x.type === 'boss');
  const maxN = Math.max(...mons.map(x => x.foes.length));
  const kinds = {}; mons.forEach(x => x.foes.forEach(k => { kinds[k] = (kinds[k] || 0) + 1; }));
  ok(boss.length === 1 && boss[0].foes[0] === cfg.boss, cfg.n + ' 沒有首領');
  ok(maxN <= cap, cfg.n + ' 遭遇數超過上限 ' + maxN + '>' + cap);
  ok(Object.keys(kinds).every(k => D.EN[k]), cfg.n + ' 有未定義的魔物');
  ok(d.grid[1][1] === '.', cfg.n + ' 起點不是通道');
  const main = T.stat(cfg.mons[0], f), b = T.stat(cfg.boss, f);
  console.log(`${cfg.n}｜格 ${d.n}×${d.n}｜遭遇 ${mons.length} 組（最多 ${maxN} 隻）｜${cfg.mons[0]} HP${main.hp} 傷${main.d}｜${cfg.boss} HP${b.hp} 傷${b.d}`);
}

// 2. 一趟流程：啟用 → 到入口 → 進第 1 層 → 打一組雜兵 → 打首領 → 回地面
console.log('== 流程 ==');
sandbox.__fast = 1;
const G = T.G();
G.started = true; G.name = '測試'; G.tourDone = true; G.loc = 'hgate';
ok(String(T.sf('hui')) === '1', '開局可選樓層應只有第 1 層，實際 ' + T.sf('hui'));
T.enter(1); flush();
ok(G.in && G.f === 1, '沒有進入第 1 層');
G.lv = 6; G.hp = 175;                       // 測試用：拉高等級
const d1 = T.fd(1), mon = d1.feats.find(x => x.type === 'mon'), boss = d1.feats.find(x => x.type === 'boss');
function fight(ft) {
  T.startBattle({ type: ft.type, id: ft.id, foes: ft.foes, ctx: 'dg' });
  let n = 0;
  while (T.BT() && !T.BT().over && n++ < 200) { T.cmd('atk', T.BT().foes.findIndex(x => x.hp > 0)); }
  const res = T.BT() ? T.BT().over : '?'; flush(); return res;
}
ok(fight(mon) === 'win', '雜兵戰沒有獲勝');
ok(fight(boss) === 'win', '首領戰沒有獲勝');
ok(G.guard[1] && G.bound.indexOf(1) >= 0, '打倒首領後沒有記錄第 1 層');
ok(String(T.sf('hui')) === '1,2', '打倒首領後應可選第 2 層，實際 ' + T.sf('hui'));
ok(String(T.sf('po')) === '8', '珀蘭應只可選第 1 層，實際 ' + T.sf('po'));
const sum = T.summary();
console.log(sum);
ok(/灰榆迷宮/.test(sum) && /大苔菇/.test(sum), '探索紀錄內容不完整');
ok(!/undefined|NaN/.test(sum), '探索紀錄出現 undefined 或 NaN');
T.exit(); flush();
ok(!G.in && G.loc === 'hgate', '回地面後位置不對：' + G.loc);

// 3. 珀蘭入場費
G.loc = 'pgate'; G.pts = 10; T.enter(8); flush();
ok(!G.in, '納爾不足時不應能進入珀蘭');
G.pts = 100; T.enter(8); flush();
ok(G.in && G.f === 8 && G.pts === 80, '珀蘭入場費沒有正確扣除，納爾 ' + G.pts);
T.exit(); flush();

// 4. 給 AI 的資料與各分頁不可出錯
const c = JSON.stringify(T.compact()), tail = T.tail();
ok(!/undefined|NaN|手繩|銀幣|燈油/.test(c + tail), '給 AI 的資料有殘留字樣');
ok(!/米諾斯|手繩|銀幣|燈油|線之|阿里阿德涅/.test(html), '頁面有米諾斯殘留字樣');
console.log(c);

// 4b. 六人隊伍、站位、魔物房、首領房等候室、全隊倒下
console.log('== 隊伍與戰鬥 ==');
T.act2('allJoin');
ok(G.roster.length === 8 && G.party.length === 5, '全部加入後應有 8 位同伴、5 位出戰，實際 ' + G.roster.length + '/' + G.party.length);
const rows = T.members().map(u => u.row || 'f');
ok(rows.filter(r => r === 'f').length <= 3 && rows.filter(r => r === 'b').length <= 3, '前後衛人數超過 3');
ok(T.setRow(G.roster.find(r => r.name === '伊瑟琳'), 'f') !== '' || T.members().filter(u => (u.row) === 'f').length <= 3, '前衛已滿時不應再塞人');
Object.keys(D.COMP).forEach(n => { const p = G.roster.find(r => r.name === n), st = T.st(p);
  ok(st.hp > 0 && st.mp >= 0 && !isNaN(st.def), n + ' 的能力值有誤');
  D.COMP[n].ai.forEach(k => ok(D.SKILL[k], n + ' 的技能 ' + k + ' 沒有定義')); });
for (let f = 1; f < D.FL.length; f++) { const d = T.fd(f), nest = d.feats.filter(x => x.type === 'nest');
  ok(nest.length === 1, D.FL[f].n + ' 沒有魔物房');
  ok(d.grid.some(r => r.indexOf('H') >= 0), D.FL[f].n + ' 沒有隱藏牆');
  if (nest[0]) ok(nest[0].foes.length <= D.NEST.max && nest[0].foes.length >= 4, D.FL[f].n + ' 魔物房數量不對');
  d.feats.filter(x => x.type === 'mon' && D.EN[x.foes[0]].pack && x.foes.every(k => k === x.foes[0])).forEach(x => ok(x.foes.length === D.encounterCap(D.FL[f].lv), D.FL[f].n + ' 成群魔物沒有滿編')); }
G.loc = 'hgate'; G.pts = 1000; T.enter(1); flush();
// 走進隱藏牆：牆會打開，不會直接開戰
const dd = T.fd(1); let hx = -1, hy = -1; dd.grid.forEach((r, y) => r.forEach((c, x) => { if (c === 'H') { hx = x; hy = y; } }));
const nb = [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]].map(o => ({ x: hx - o[0], y: hy - o[1], d: o[2] })).find(o => T.CUR()[o.y] && T.CUR()[o.y][o.x] === '.' && !dd.feats.some(ft => ft.x === o.x && ft.y === o.y));
T.put(nb.x, nb.y); T.face(nb.d); T.act('fwd'); flush();
ok(T.CUR()[hy][hx] === '.' && !T.BT(), '隱藏牆沒有打開');
// 首領房等候室：走向首領先跳確認
const bs = dd.feats.find(x => x.type === 'boss');
const bn = [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]].map(o => ({ x: bs.x - o[0], y: bs.y - o[1], d: o[2] })).find(o => T.CUR()[o.y] && T.CUR()[o.y][o.x] === '.');
delete G.guard[1]; T.put(bn.x, bn.y); T.face(bn.d); T.act('fwd'); flush();
ok(!T.BT() && /等候室/.test(T.modalHtml()), '走向首領時沒有出現等候室');
// 六人戰鬥跑得完，且結束後沒有人停在 0 HP
const r6 = fight(dd.feats.find(x => x.type === 'nest'));
ok(r6 === 'win', '六人打魔物房沒有獲勝：' + r6);
ok(T.members().every(u => u.hp > 0), '戰後有人停在 0 HP');
ok(!/undefined|NaN/.test(T.ui('dg') + T.ui('stat')), '隊伍畫面出現 undefined 或 NaN');
// 全隊倒下：不會結束遊戲，回到入口，扣三成納爾
T.exit(); flush(); G.loc = 'pgate'; G.bound = []; for (let i = 1; i < 19; i++) G.bound.push(i);
G.party = []; G.lv = 1; G.hp = 10; G.pts = 1000; T.enter(19); flush();
const p0 = G.pts; T.startBattle({ type: 'mon', id: 'x', foes: ['獨眼岩偶', '鐵角牛', '毒棘蠍'], ctx: 'dg' });
let nn = 0; while (T.BT() && !T.BT().over && nn++ < 300) T.cmd('def');
ok(T.BT() && T.BT().over === 'lose', '應該全隊倒下');
flush(); ok(/全隊倒下/.test(T.modalHtml()), '沒有出現全隊倒下的說明');
T.act2('doWipe'); flush();
ok(!G.in && !G.dead && G.loc === 'pgate' && G.pts === p0 - Math.floor(p0 * .3) && G.hp > 0, '全隊倒下後的狀態不對');
G.lv = 6; G.hp = T.st(G).hp; T.act2('allJoin');

// 5. 每個分頁、每個地點都畫得出來
console.log('== 畫面 ==');
Object.keys(D.LOC).forEach(loc => {
  G.loc = loc;
  ['story', 'dg', 'stat', 'shop', 'sys'].forEach(tab => {
    let h = '';
    try { h = T.ui(tab); } catch (e) { ok(false, loc + '/' + tab + ' 出錯：' + e.message); }
    ok(!/undefined|NaN/.test(h), loc + '/' + tab + ' 畫面出現 undefined 或 NaN');
  });
});
G.loc = 'hguild'; ok(/回復藥/.test(T.ui('shop')) && /歸途石/.test(T.ui('shop')), '公會商店沒有列出補給品');
G.loc = 'smith'; ok(/強化攻擊/.test(T.ui('shop')), '工坊沒有強化選項');
G.loc = 'pgate'; ok(/進入珀蘭大迷宮/.test(T.ui('story')) && /回灰榆鎮/.test(T.ui('story')), '珀蘭入口的按鈕不對');
G.loc = 'inn'; ok(/前往珀蘭城/.test(T.ui('story')) && !/進入灰榆迷宮/.test(T.ui('story')), '旅館的按鈕不對');
G.loc = 'hgate'; G.bound = [1]; const ask = T.ask();
ok(/第1層/.test(ask) && /第2層/.test(ask) && !/第3層/.test(ask) && !/undefined/.test(ask), '入口選層視窗不對');
T.enter(2); flush(); ok(/入口小房間/.test(T.spring()) && /回地面/.test(T.spring()), '入口小房間選單不對');
ok(!/undefined|NaN/.test(T.ui('dg')), '迷宮畫面出現 undefined');
T.exit(); flush();
console.log('5 個分頁 × 8 個地點、入口選層、入口小房間：已檢查');

console.log(fail ? `\n有 ${fail} 項失敗` : '\n全部通過');
process.exit(fail ? 1 : 0);
