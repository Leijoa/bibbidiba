// js/data.js

export const RARITY = {
    1: { label: '普通', color: 'text-slate-300', bg: 'bg-slate-700/50', border: 'border-slate-500' },
    2: { label: '稀有', color: 'text-blue-400', bg: 'bg-blue-900/40', border: 'border-blue-600' },
    3: { label: '史詩', color: 'text-purple-400', bg: 'bg-purple-900/40', border: 'border-purple-600' },
    4: { label: '傳說', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-500' }
};

export const RELIC_DB = [
    // ★ 任務3：修改大一～大八與小小的文字描述
    { id: 'b1', name: '【大一】', desc: '該骰子點數以15計算', price: 10, rarity: 1 },
    { id: 'b2', name: '【大二】', desc: '該骰子點數以15計算', price: 10, rarity: 1 },
    { id: 'b8', name: '【大八】', desc: '該骰子點數以15計算', price: 10, rarity: 1 },
    { id: 'small', name: '【小小】', desc: '1,2,3 的點數倍率*8', price: 15, rarity: 2 },
    { id: 'big', name: '【大大】', desc: '6,7,8 的點數倍率*3.5', price: 15, rarity: 2 },
    { id: 'mid', name: '【中堅】', desc: '4,5 的點數倍率*4', price: 15, rarity: 2 },
    { id: 'odd', name: '【奇數】', desc: '奇數點數倍率*2.5', price: 25, rarity: 3 },
    { id: 'even', name: '【偶數】', desc: '偶數點數倍率*2.5', price: 25, rarity: 3 },
    { id: 'coin', name: '【幸運金幣】', desc: '結算時獲得金幣 +15', price: 20, rarity: 3 },
    { id: 'pansy', name: '【潘絲絲的祝福】', desc: '場上有 8 時總傷害 x3', price: 35, rarity: 4 },
    { id: 'blue', name: '【青發的加護】', desc: '大滿貫倍率從 x8 變 x24', price: 35, rarity: 4 },
    { id: 'order', name: '【絕對秩序】', desc: '同數與順序倍率相加後再相乘', price: 40, rarity: 4 },
    { id: 'refresh', name: '【刷新幣】', desc: '初始重骰次數 +2', price: 35, rarity: 4 },
];

export const ENEMY_DB = [
    { name: '史萊姆', hp: 800, turns: 3 },
    { name: '哥布林小隊', hp: 2500, turns: 3 },
    { name: '巨石傀儡 (菁英)', hp: 10000, turns: 4 },
    { name: '深淵魔龍', hp: 50000, turns: 4 },
    { name: '創世神 (最終Boss)', hp: 200000, turns: 5 },
];

export const RULE_DB = {
    groupA: [
        { name: '八重奏', desc: '8顆相同數字', multi: 'x50.0' },
        { name: '七同', desc: '7顆相同數字', multi: 'x25.0' },
        { name: '六同', desc: '6顆相同數字', multi: 'x12.0' },
        { name: '五同', desc: '5顆相同數字', multi: 'x6.0' },
        { name: '四同', desc: '4顆相同數字', multi: 'x4.5' },
        { name: '三同', desc: '3顆相同數字', multi: 'x2.5' },
        { name: '對子', desc: '2顆相同數字', multi: 'x1.5' }
    ],
    groupB: [
        { name: '大滿貫', desc: '1~8各有一顆', multi: 'x8.0' },
        { name: '三龍會', desc: '分成三組完全相連的順子', multi: 'x12.0' },
        { name: '雙順', desc: '兩組4連順', multi: 'x6.0' },
        { name: '五連順', desc: '5顆數字相連', multi: 'x3.5' },
        { name: '雙三連順', desc: '兩組3連順', multi: 'x3.0' },
        { name: '三連順', desc: '3顆數字相連', multi: 'x2.0' }
    ],
    groupC: [
        { name: '雙子星', desc: '兩組4同', multi: 'x20.0' },
        { name: '葫蘆', desc: '5同 + 3同', multi: 'x15.0' },
        { name: '經典四對子', desc: '嚴格的4組對子(無3同或4同)', multi: 'x10.0' },
        { name: '中葫蘆', desc: '4同 + 3同', multi: 'x8.0' },
        { name: '平胡', desc: '兩組3連順 + 一組對子', multi: 'x6.0' },
        { name: '碰碰胡', desc: '兩組3同 + 一組對子', multi: 'x5.0' },
        { name: '四對子', desc: '任意4組對子', multi: 'x5.0' },
        { name: '雙三同', desc: '兩組3同', multi: 'x3.5' },
        { name: '小葫蘆', desc: '3同 + 一組對子', multi: 'x3.5' },
        { name: '三對子', desc: '任意3組對子', multi: 'x3.0' },
        { name: '雙對子', desc: '任意2組對子', multi: 'x2.0' }
    ],
    groupD: [
        { name: '兩極', desc: '盤面只有 1 和 8', multi: 'x30.0' },
        { name: '絕對秩序', desc: '全奇數或全偶數', multi: 'x8.0' },
        { name: '全異', desc: '8顆數字皆不相同', multi: 'x2.5' }
    ]
};
