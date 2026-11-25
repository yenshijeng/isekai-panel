// 平衡模擬：node tools/sim.js [每場次數]
// 依進度估計隊伍組成與等級，對每一層的雜兵（滿編）與首領各打 N 場，列出勝率與回合數。
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), N = +process.argv[2] || 40;
function el(){return{innerHTML:'',textContent:'',value:'',_h:null,scrollTop:0,dataset:{},style:{},width:480,height:300,classList:{add(){},remove(){},contains(){return false}},addEventListener(){},querySelector(){return null},select(){},getContext(){return ctx2d},toDataURL(){return'data:,'},closest(){return null},remove(){}}}
const ctx2d=new Proxy({},{get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k in t)return t[k];return()=>{}},set(t,k,v){t[k]=v;return true}});
const els={},timers=[],store={};
const sb={console,Math,JSON,Object,Array,String,Number,Date,parseInt,parseFloat,isNaN,Error,Float32Array,RegExp,
 document:{getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener(){}},
 localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v)}},
 setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},requestAnimationFrame(){},addEventListener(){},
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),unescape,escape,encodeURIComponent,decodeURIComponent};
sb.window=sb;sb.parent=sb;vm.createContext(sb);
const flush=()=>{let n=0;while(timers.length&&n++<1000)timers.shift()()};
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sb);
vm.runInContext(fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>\n([\s\S]*?)<\/script>/)[1],sb);
const T=sb.__t,D=sb.ISK_DATA;sb.__fast=1;

// 各層預估：主角等級、已加入的同伴（依企劃的招募順序）
const JOIN={'葛蕾妲':1,'朵莉':2,'赫爾嘉':3,'伊瑟琳':5,'瑪蓮':8,'蜜絲緹':11,'蓓姬':12,'奧黛菈':15};   // 內部樓層編號
const PICK=['赫爾嘉','葛蕾妲','伊瑟琳','蜜絲緹','奧黛菈','瑪蓮','朵莉','蓓姬'];                        // 出戰優先序
function heroLv(f){return f<=7?f+1:8+Math.ceil((f-7)*.75)}   // 灰榆 n 層約 Lv n+1；珀蘭 n 層約 Lv 8+0.75n
function setup(f){
  T.act2('doReset');const G=T.G();G.started=true;G.tourDone=true;G.name='測';G.pts=500;
  for(let i=1;i<f;i++){G.bound.push(i);G.guard[i]=true}
  const hl=heroLv(f);G.lv=hl;
  const have=PICK.filter(n=>JOIN[n]<=f).slice(0,5);
  have.forEach(n=>{T.join(n);const p=G.roster.find(r=>r.name===n);p.lv=D.COMP[n].lv+Math.max(0,Math.round((hl-heroLv(JOIN[n]))*.8))});
  G.loc=D.FL[f].dg==='hui'?'hgate':'pgate';T.enter(f);flush();
  [G].concat(G.roster).forEach(u=>{const s=T.st(u);u.hp=s.hp;u.mp=s.mp});
  return have;
}
function fight(type,foes){
  T.startBattle({type,id:'sim',foes,ctx:'dg'});let n=0;
  while(T.BT()&&!T.BT().over&&n++<300){const B=T.BT(),P=B.party[0];if(B.mode!=='cmd')break;
    const fsL=B.foes.map((x,i)=>[x,i]).filter(o=>o[0].hp>0).sort((a,b)=>a[0].hp-b[0].hp);
    T.cmd(P.mp>=3&&T.G().lv>=1?'str':'atk',fsL[0][1]);}
  const B=T.BT(),res=B?B.over:'?',rounds=B?B.round:0,downs=B?B.party.filter(p=>p.hp<=0).length:0,hpLeft=B?Math.round(100*B.party.reduce((a,p)=>a+p.hp,0)/B.party.reduce((a,p)=>a+p.max,0)):0;
  flush();const mb=sb.document.getElementById('modal');return{res,rounds,downs,hpLeft};
}
console.log('樓層｜隊伍｜雜兵滿編：勝率 回合 剩餘HP%｜首領：勝率 回合 倒地數 剩餘HP%');
for(let f=1;f<D.FL.length;f++){
  const cfg=D.FL[f],cap=D.encounterCap(cfg.lv);let line=cfg.n.replace('大迷宮','').replace('迷宮','')+'｜';
  const agg=(type,foes)=>{let w=0,r=0,d=0,h=0;for(let i=0;i<N;i++){setup(f);const o=fight(type,foes);if(o.res==='win'){w++;h+=o.hpLeft}r+=o.rounds;d+=o.downs}return{w:Math.round(100*w/N),r:(r/N).toFixed(1),d:(d/N).toFixed(1),h:w?Math.round(h/w):0}};
  const have=setup(f);line+='Lv'+heroLv(f)+'＋'+have.length+'人｜';
  const m=agg('mon',Array(cap).fill(cfg.mons[0])),b=agg('boss',[cfg.boss]);
  line+=`${m.w}% ${m.r}回 ${m.h}%｜${b.w}% ${b.r}回 倒${b.d} ${b.h}%`;
  console.log(line);
}
