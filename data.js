// 異世界迷宮・探索手帳 資料表
// 所有數值都是首輪測試值；調整平衡只改這個檔案，不必動 index.html。
(function(){
'use strict';
var D={};
D.VER='0.2.0';

// ===== 地點 =====
// 鍵名以 p 開頭的是珀蘭城，其餘是灰榆鎮。
D.LOC={
 inn:'灰榆鎮・旅館',
 hguild:'灰榆鎮・探索者公會',
 smith:'灰榆鎮・殘火工坊',
 hgate:'灰榆迷宮入口',
 pguild:'珀蘭城・探索者公會',
 pmarket:'珀蘭城・商人公會',
 ptemple:'珀蘭城・大神殿',
 pgate:'珀蘭大迷宮入口'
};
// AI 時空列出現這些字時，手帳會自動換到對應地點。
D.LOC_ALIAS={
 inn:['旅館'],
 hguild:['灰榆鎮・探索者公會','灰榆公會'],
 smith:['殘火工坊','工坊'],
 hgate:['灰榆迷宮入口','鎮外土丘'],
 pguild:['珀蘭城・探索者公會','珀蘭公會'],
 pmarket:['商人公會'],
 ptemple:['大神殿'],
 pgate:['珀蘭大迷宮入口','大迷宮入口']
};
D.SHOPS=['hguild','pmarket'];   // 可以買補給的地點
D.SMITH='smith';                // 可以強化裝備的地點

// ===== 迷宮 =====
D.DUNGEON={
 hui:{n:'灰榆迷宮',gate:'hgate',fee:0,intro:'鎮外森林的土丘上，有一面純黑的牆。穿過去就是迷宮。'},
 po:{n:'珀蘭大迷宮',gate:'pgate',fee:20,intro:'城中心的石造入口，公會的人在門口收入場費。'}
};

// ===== 道具 =====
D.ITEM={
 potion:{n:'回復藥',c:25,note:'回復 45 生命'},
 fire:{n:'火焰瓶',c:35,note:'對全體敵人造成 22 傷害'},
 revive:{n:'甦醒藥',c:60,note:'救起倒地的人（生命 40%）'},
 antidote:{n:'解毒藥',c:20,note:'解除一人的中毒與麻痺'},
 stone:{n:'歸途石',c:30,note:'在迷宮任何位置使用，立刻回到地面'}
};

// ===== 魔物（一級基準值）=====
// 實際數值 = 基準 ×（1 + 0.3 ×（樓層 − 1））。
// arm：物理減傷；weak：弱點屬性；agi：敏捷（決定行動順序，沒寫是 7）。
// 特性：hit＝攻擊命中時附加異常；pack＝必定滿編出現；cast＝詠唱一回合後放魔法，可打後衛；
//       drain＝吸血比例；aoe＝每隔幾回合全體攻擊；charge＝蓄力一回合後重擊；sluggish＝兩回合才動一次。
D.SCALE=0.42;     // 每深一層，魔物數值增加的比例
D.EN_HP=2.4;       // 全部魔物的生命倍率（依六人隊調整）
D.EN_DMG=1.75;      // 全部魔物的傷害倍率
D.EN={
 '苔菇':    {hp:14,d:4, xp:3,pts:5, shape:'blob', col:'#6a9a4a',img:'mush',    weak:['火'],agi:5, hit:{k:'sleep',p:.2}},
 '絨角兔':  {hp:12,d:5, xp:3,pts:5, shape:'quad', col:'#c8b89a',img:'rabbit',  weak:['風'],agi:16},
 '鏽牙鼬':  {hp:16,d:6, xp:4,pts:6, shape:'quad', col:'#8a5a3a',img:'weasel',  weak:['火'],agi:11,pack:1},
 '纏根木':  {hp:22,d:5, xp:5,pts:7, shape:'blob', col:'#6a5230',img:'root',    weak:['火'],agi:4, hit:{k:'bind',p:.25}},
 '泥殼蟹':  {hp:20,d:6, xp:5,pts:7, shape:'bug',  col:'#7a6a52',img:'crab',    weak:['風','水'],arm:2,agi:5},
 '灰羽梟':  {hp:15,d:8, xp:5,pts:8, shape:'ghost',col:'#9a9aa8',img:'owl',     weak:['土'],agi:12,cast:{elem:'風',mult:1.3,n:'風刃'}},
 '水道蛭':  {hp:18,d:5, xp:4,pts:6, shape:'blob', col:'#7a3a4a',img:'leech',   weak:['火'],agi:6, drain:.5},
 '珊瑚傀':  {hp:24,d:6, xp:6,pts:8, shape:'human',col:'#d88a8a',img:'coral',   weak:['風'],agi:6, hit:{k:'stone',p:.12}},
 '燐火蛾':  {hp:13,d:7, xp:5,pts:8, shape:'bug',  col:'#e08a3a',img:'moth',    weak:['水'],agi:12,aoe:{every:3,mult:.6,elem:'火',n:'鱗粉火雨'}},
 '鏡鱗魚人':{hp:20,d:7, xp:6,pts:9, shape:'human',col:'#4aa8a8',img:'merman',  weak:['土'],agi:8, cast:{elem:'水',mult:1.3,n:'水槍'}},
 '毒棘蠍':  {hp:18,d:7, xp:6,pts:9, shape:'bug',  col:'#8a4aa8',img:'scorpion',weak:['水'],agi:9, hit:{k:'poison',p:.35}},
 '絲繭蟲':  {hp:14,d:5, xp:4,pts:6, shape:'bug',  col:'#e0e0d0',img:'cocoon',  weak:['火'],agi:7, hit:{k:'slow',p:.4}},
 '鐵角牛':  {hp:30,d:9, xp:8,pts:11,shape:'quad', col:'#4a4a52',img:'bull',    weak:['水'],agi:7, charge:{every:3,mult:2.2}},
 '獨眼岩偶':{hp:34,d:10,xp:9,pts:12,shape:'giant',col:'#8a8a82',img:'golem',   weak:['風'],agi:3, sluggish:1},
 // 地面戰鬥用
 '地痞':    {hp:18,d:6, xp:4,pts:6, shape:'human',col:'#7a6a4a',img:'thug'},
 '小偷':    {hp:14,d:5, xp:3,pts:5, shape:'human',col:'#4a4a5a',img:'thug'}
};

// ===== 首領 =====
// 一般首領：該層魔物的大型個體，圖片共用。生命 ×6、傷害 ×1.5。
// 專屬首領（uniq）：另有圖片。生命 ×8、傷害 ×1.7。
D.BOSS_MULT={normal:{hp:9,d:1.5,xp:8,pts:10},uniq:{hp:10,d:1.7,xp:14,pts:20}};
D.BOSS={
 '大苔菇':  {base:'苔菇'},
 '大絨角兔':{base:'絨角兔'},
 '鼬王':    {base:'鏽牙鼬'},
 '空樹守':  {base:'纏根木',uniq:1,img:'hollow',shape:'giant',col:'#5a4a2a'},
 '大泥殼蟹':{base:'泥殼蟹'},
 '梟主':    {base:'灰羽梟'},
 '灰榆之心':{base:'絲繭蟲',uniq:1,img:'heart',shape:'giant',col:'#9a8a6a'},
 '大水道蛭':{base:'水道蛭'},
 '石化女像':{base:'珊瑚傀',uniq:1,img:'statue',shape:'giant',col:'#c8a8a8'},
 '大燐火蛾':{base:'燐火蛾'},
 '大纏根木':{base:'纏根木'},
 '水道祭司':{base:'鏡鱗魚人',uniq:1,img:'priest',shape:'giant',col:'#3a8a9a'},
 '大毒棘蠍':{base:'毒棘蠍'},
 '大鐵角牛':{base:'鐵角牛'},
 '歷代名單的守門者':{base:'獨眼岩偶',uniq:1,img:'keeper',shape:'giant',col:'#6a6a7a'}
};

// ===== 異常狀態 =====
// dur：持續回合（0＝直到解除或戰鬥結束）。戰鬥結束時全部解除。
D.FX={
 poison:{n:'中毒',icon:'☠',dur:0,foeDur:4,rate:.06,bossRate:.03},
 para:  {n:'麻痺',icon:'⚡',dur:3,skip:.5,bossSkip:.25},
 sleep: {n:'睡眠',icon:'💤',dur:2},
 bind:  {n:'束縛',icon:'⛓',dur:1},
 slow:  {n:'遲緩',icon:'🕸',dur:3},
 stone: {n:'石化',icon:'🗿',dur:0},
 expose:{n:'破綻',icon:'🎯',dur:3,bonus:.25},
 taunt: {n:'挑釁',icon:'📣',dur:3}
};
D.BOSS_IMMUNE=['stone','sleep','bind'];   // 專屬首領免疫
D.BACK_MELEE=0.6;                        // 後衛用近戰攻擊的傷害倍率
D.WEAK=1.5;                              // 打到弱點的倍率

// ===== 主角 =====
// 能力 = base + grow ×（等級 − 1）。wpn 武器值、arm 護甲值。
D.HERO={job:'探索者',row:'f',wpn:8,arm:2,
 base:{hp:100,mp:20,str:4,vit:3,int:3,mnd:3,agi:8},
 grow:{hp:14,mp:3,str:2,vit:1,int:1,mnd:1,agi:.3}};
// 主角技能（M3-3 會改成由職業取得）
D.HERO_SKILLS=[['str',1],['combo',3],['pierce',5],['cheer',7],['heal',9]];

// ===== 同伴 =====
// lv 是加入時的等級；ranged＝普通攻擊是遠程（站後衛不扣傷害）；ai 是自動行動時依序考慮的技能。
D.COMP={
 '葛蕾妲':{job:'鍛冶師',race:'人類',lv:4,row:'f',wpn:10,arm:3,col:'#e0703a',
  base:{hp:85,mp:16,str:6,vit:5,int:2,mnd:3,agi:6},grow:{hp:12,mp:3,str:1.8,vit:1.2,int:0.4,mnd:.8,agi:.3},ai:['crack','hammer']},
 '赫爾嘉':{job:'騎士',race:'虎人',lv:8,row:'f',wpn:11,arm:5,col:'#8a8f98',
  base:{hp:110,mp:14,str:6,vit:7,int:2,mnd:4,agi:7},grow:{hp:14,mp:3,str:1.5,vit:1.6,int:0.3,mnd:1,agi:.3},ai:['taunt','bash']},
 '伊瑟琳':{job:'巫女',race:'精靈',lv:7,row:'b',wpn:5,arm:1,col:'#dfe6f0',
  base:{hp:70,mp:40,str:3,vit:3,int:5,mnd:9,agi:7},grow:{hp:9,mp:6,str:0.7,vit:.8,int:0.9,mnd:2,agi:.3},ai:['purify','mendall','mend']},
 '蜜絲緹':{job:'暗殺者',race:'狐人',lv:6,row:'f',wpn:9,arm:2,col:'#9a5ac8',
  base:{hp:75,mp:20,str:6,vit:4,int:4,mnd:4,agi:14},grow:{hp:10,mp:4,str:1.7,vit:1,int:0.6,mnd:.8,agi:.5},ai:['backstab','venom','needle']},
 '奧黛菈':{job:'魔道士',race:'龍人',lv:9,row:'b',wpn:4,arm:1,col:'#3a5ab8',
  base:{hp:65,mp:45,str:2,vit:3,int:10,mnd:6,agi:7},grow:{hp:8,mp:7,str:0.3,vit:.8,int:1.8,mnd:1.2,agi:.3},ai:['storm','ball']},
 '瑪蓮':  {job:'探索者',race:'人類',lv:7,row:'b',wpn:8,arm:2,ranged:1,col:'#c8a04a',
  base:{hp:80,mp:18,str:5,vit:5,int:4,mnd:4,agi:9},grow:{hp:10,mp:3,str:1.3,vit:1.1,int:0.6,mnd:.8,agi:.4},ai:['firstaid','expose']},
 '蓓姬':  {job:'商人',race:'矮人',lv:4,row:'b',wpn:6,arm:2,ranged:1,col:'#3a7a52',
  base:{hp:70,mp:12,str:4,vit:4,int:5,mnd:5,agi:6},grow:{hp:8,mp:2,str:0.8,vit:.9,int:0.8,mnd:1,agi:.3},ai:['coin']},
 '朵莉':  {job:'藥草採取士',race:'兔人',lv:3,row:'b',wpn:5,arm:1,ranged:1,col:'#8ac86a',
  base:{hp:60,mp:24,str:3,vit:3,int:5,mnd:7,agi:11},grow:{hp:8,mp:4,str:0.7,vit:.8,int:0.8,mnd:1.6,agi:.4},ai:['antidote','herb']}
};
D.START_PARTY=['葛蕾妲'];   // 啟用手帳時就在隊伍裡的同伴
D.PARTY_MAX=5;   // 同伴上限（加主角共六人）
D.ROW_MAX=3;     // 前衛、後衛各最多幾人

// ===== 技能 =====
// kind：phys 物理單體｜magic 魔法單體｜magicall 魔法全體｜heal 治療單體｜healall 治療全體
//       cure 解除異常｜taunt 挑釁｜buff 全隊增傷｜expose 破綻｜coin 撒幣
D.SKILL={
 // 主角
 str:   {n:'強擊',mp:3,kind:'phys',mult:1.8,d:'單體 1.8 倍傷害'},
 combo: {n:'連擊',mp:4,kind:'phys',mult:.9,hits:2,d:'打兩次，各 0.9 倍傷害'},
 pierce:{n:'破甲',mp:4,kind:'phys',mult:1.2,pierce:1,d:'單體 1.2 倍傷害，無視防禦'},
 cheer: {n:'鼓舞',mp:6,kind:'buff',dur:3,d:'全隊傷害 +25%，持續 3 回合'},
 heal:  {n:'治療',mp:6,kind:'heal',pct:.35,d:'回復一名隊友 35% 生命'},
 // 葛蕾妲
 hammer:{n:'重槌',mp:3,kind:'phys',mult:1.7},
 crack: {n:'破甲槌',mp:4,kind:'phys',mult:1.2,pierce:1,when:'armored'},
 // 赫爾嘉
 taunt: {n:'挑釁',mp:2,kind:'taunt'},
 bash:  {n:'盾擊',mp:3,kind:'phys',mult:1,fx:{k:'bind',p:.4}},
 // 伊瑟琳
 mend:   {n:'手當',mp:4,kind:'heal',base:22,scale:2.2},
 mendall:{n:'祈癒',mp:10,kind:'healall',base:10,scale:1.2},
 purify: {n:'淨化',mp:3,kind:'cure',cures:['poison','para','sleep','bind','slow','stone']},
 // 蜜絲緹
 venom:   {n:'毒刃',mp:2,kind:'phys',mult:1,fx:{k:'poison',p:.7}},
 needle:  {n:'麻痺針',mp:3,kind:'phys',mult:.8,fx:{k:'para',p:.5}},
 backstab:{n:'背刺',mp:4,kind:'phys',mult:2.4,when:'afflicted'},
 // 奧黛菈
 ball: {n:'元素彈',mp:4,kind:'magic',base:10,elems:['火','水','風','土'],names:{'火':'火球','水':'水球','風':'風球','土':'土球'}},
 storm:{n:'烈焰風暴',mp:10,kind:'magicall',base:7,elem:'火',when:'crowd'},
 // 瑪蓮
 firstaid:{n:'應急包紮',mp:3,kind:'heal',base:25,scale:1},
 expose:  {n:'看破',mp:3,kind:'expose'},
 // 蓓姬
 coin:{n:'撒幣',mp:0,kind:'coin',cost:10,base:18,perLv:3},
 // 朵莉
 herb:    {n:'藥草敷貼',mp:3,kind:'heal',base:18,scale:1.5},
 antidote:{n:'解毒草',mp:2,kind:'cure',cures:['poison','para']}
};
D.MAGIC_INT=1.2;     // 魔法傷害 = 基礎值 + 知力 × 這個數
D.NEST={extra:3,max:6};   // 魔物房的魔物數 = 該層遭遇上限 + extra，最多 max

// ===== 樓層 =====
// 內部用連續編號：1～7 是灰榆迷宮，8～19 是珀蘭大迷宮第 1～12 層。
// lv 是該迷宮內的層數，也是魔物等級。mons 第一個是該層主要魔物。
function fl(dg,lv,size,boss,mons){
 var name=D.DUNGEON[dg].n+'・第'+lv+'層';
 return{dg:dg,lv:lv,n:name,size:size,seed:(dg==='hui'?1000:5000)+lv*1101,boss:boss,mons:mons,nM:size};
}
D.FL=[null,
 fl('hui',1, 9,'大苔菇',  ['苔菇']),
 fl('hui',2,10,'大絨角兔',['絨角兔','苔菇']),
 fl('hui',3,11,'鼬王',    ['鏽牙鼬','絨角兔','苔菇']),
 fl('hui',4,12,'空樹守',  ['纏根木','鏽牙鼬','絨角兔']),
 fl('hui',5,12,'大泥殼蟹',['泥殼蟹','纏根木','鏽牙鼬']),
 fl('hui',6,13,'梟主',    ['灰羽梟','泥殼蟹','纏根木']),
 fl('hui',7,13,'灰榆之心',['絲繭蟲','灰羽梟','泥殼蟹']),
 fl('po', 1,10,'大絨角兔',['絨角兔']),
 fl('po', 2,11,'大水道蛭',['水道蛭','絨角兔']),
 fl('po', 3,11,'鼬王',    ['鏽牙鼬','水道蛭','絨角兔']),
 fl('po', 4,12,'石化女像',['珊瑚傀','鏽牙鼬','水道蛭']),
 fl('po', 5,12,'大燐火蛾',['燐火蛾','珊瑚傀','鏽牙鼬']),
 fl('po', 6,13,'大泥殼蟹',['泥殼蟹','燐火蛾','珊瑚傀']),
 fl('po', 7,13,'大纏根木',['纏根木','泥殼蟹','燐火蛾']),
 fl('po', 8,14,'水道祭司',['鏡鱗魚人','纏根木','泥殼蟹']),
 fl('po', 9,14,'梟主',    ['灰羽梟','鏡鱗魚人','纏根木']),
 fl('po',10,14,'大毒棘蠍',['毒棘蠍','灰羽梟','鏡鱗魚人']),
 fl('po',11,15,'大鐵角牛',['鐵角牛','毒棘蠍','灰羽梟']),
 fl('po',12,15,'歷代名單的守門者',['獨眼岩偶','鐵角牛','毒棘蠍'])
];

// 一次遭遇的魔物數量上限（依層數）
D.encounterCap=function(lv){return lv>=8?4:lv>=4?3:lv>=2?2:1};

// ===== 光線 =====
// 迷宮的牆自己會發光，所以不需要燈。畫面不閃爍。
// 亮度 = near /（1 + k1×距離 + k2×距離²），上限 max；vignette 是畫面四角變暗的程度（0＝不變暗）。
D.LIGHT={near:1.25,max:1.12,k1:0.07,k2:0.012,vignette:0.18};

// ===== 牆面配色 =====
// 灰榆：樹根與泥土，越深越偏褐。珀蘭：石造水道，越深越藍。
function mix(a,b,t){return[Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)]}
function hex(c){return'#'+c.map(function(v){return('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2)}).join('')}
function pal(w,door){
 return{w:w,door:door,
  ce:[hex(mix([0,0,0],w,.5)),hex(mix([0,0,0],w,.3))],   // 天花板：頭頂亮、遠處暗
  fl:[hex(mix([0,0,0],w,.32)),hex(mix([0,0,0],w,.62))]}; // 地板：遠處暗、腳邊亮
}
D.PAL=[null];
D.FL.forEach(function(f){
 if(!f)return;
 if(f.dg==='hui'){var t=(f.lv-1)/6;D.PAL.push(pal(mix([198,204,154],[214,188,152],t),[150,108,62]))}
 else{var u=(f.lv-1)/11;D.PAL.push(pal(mix([216,214,206],[164,188,224],u),[146,124,100]))}
});

window.ISK_DATA=D;
})();
