// 異世界迷宮・探索手帳 資料表
// 所有數值都是首輪測試值；調整平衡只改這個檔案，不必動 index.html。
(function(){
'use strict';
var D={};
D.VER='0.1.0';

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
 stone:{n:'歸途石',c:30,note:'在迷宮任何位置使用，立刻回到地面'}
};

// ===== 魔物（一級基準值）=====
// 實際數值 = 基準 ×（1 + 0.3 ×（樓層 − 1））。
// arm：物理減傷；weak：弱點屬性（M3-2 起生效）。
D.SCALE=0.3;
D.EN={
 '苔菇':    {hp:14,d:4, xp:3,pts:5, shape:'blob', col:'#6a9a4a',img:'mush',    weak:['火']},
 '絨角兔':  {hp:12,d:5, xp:3,pts:5, shape:'quad', col:'#c8b89a',img:'rabbit',  weak:['風']},
 '鏽牙鼬':  {hp:16,d:6, xp:4,pts:6, shape:'quad', col:'#8a5a3a',img:'weasel',  weak:['火']},
 '纏根木':  {hp:22,d:5, xp:5,pts:7, shape:'blob', col:'#6a5230',img:'root',    weak:['火']},
 '泥殼蟹':  {hp:20,d:6, xp:5,pts:7, shape:'bug',  col:'#7a6a52',img:'crab',    weak:['風','水'],arm:2},
 '灰羽梟':  {hp:15,d:8, xp:5,pts:8, shape:'ghost',col:'#9a9aa8',img:'owl',     weak:['土']},
 '水道蛭':  {hp:18,d:5, xp:4,pts:6, shape:'blob', col:'#7a3a4a',img:'leech',   weak:['火']},
 '珊瑚傀':  {hp:24,d:6, xp:6,pts:8, shape:'human',col:'#d88a8a',img:'coral',   weak:['風']},
 '燐火蛾':  {hp:13,d:7, xp:5,pts:8, shape:'bug',  col:'#e08a3a',img:'moth',    weak:['水']},
 '鏡鱗魚人':{hp:20,d:7, xp:6,pts:9, shape:'human',col:'#4aa8a8',img:'merman',  weak:['土']},
 '毒棘蠍':  {hp:18,d:7, xp:6,pts:9, shape:'bug',  col:'#8a4aa8',img:'scorpion',weak:['水']},
 '絲繭蟲':  {hp:14,d:5, xp:4,pts:6, shape:'bug',  col:'#e0e0d0',img:'cocoon',  weak:['火']},
 '鐵角牛':  {hp:30,d:9, xp:8,pts:11,shape:'quad', col:'#4a4a52',img:'bull',    weak:['水']},
 '獨眼岩偶':{hp:34,d:10,xp:9,pts:12,shape:'giant',col:'#8a8a82',img:'golem',   weak:['風']},
 // 地面戰鬥用
 '地痞':    {hp:18,d:6, xp:4,pts:6, shape:'human',col:'#7a6a4a',img:'thug'},
 '小偷':    {hp:14,d:5, xp:3,pts:5, shape:'human',col:'#4a4a5a',img:'thug'}
};

// ===== 首領 =====
// 一般首領：該層魔物的大型個體，圖片共用。生命 ×6、傷害 ×1.5。
// 專屬首領（uniq）：另有圖片。生命 ×8、傷害 ×1.7。
D.BOSS_MULT={normal:{hp:6,d:1.5,xp:8,pts:10},uniq:{hp:8,d:1.7,xp:14,pts:20}};
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

// ===== 牆面配色 =====
// 灰榆：樹根與泥土，越深越暗。珀蘭：石造水道，越深越藍。
function mix(a,b,t){return[Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)]}
function hex(c){return'#'+c.map(function(v){return('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2)}).join('')}
function pal(w,door){
 return{w:w,door:door,
  ce:[hex(mix([0,0,0],w,.03)),hex(mix([0,0,0],w,.13))],
  fl:[hex(mix([0,0,0],w,.06)),hex(mix([0,0,0],w,.2))]};
}
D.PAL=[null];
D.FL.forEach(function(f){
 if(!f)return;
 if(f.dg==='hui'){var t=(f.lv-1)/6;D.PAL.push(pal(mix([104,112,66],[92,70,52],t),[112,72,34]))}
 else{var u=(f.lv-1)/11;D.PAL.push(pal(mix([138,136,128],[70,92,132],u),[100,86,70]))}
});

window.ISK_DATA=D;
})();
