// js/data.js

export const RARITY = {
    1: { label: '普通', color: 'text-slate-300', bg: 'bg-slate-700/50', border: 'border-slate-500' },
    2: { label: '稀有', color: 'text-blue-400', bg: 'bg-blue-900/40', border: 'border-blue-600' },
    3: { label: '史詩', color: 'text-purple-400', bg: 'bg-purple-900/40', border: 'border-purple-600' },
    4: { label: '傳說', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-500' }
};

export const RELIC_DB = [
    // 基礎點數類 (Rarity 1)
    { id: 'b1', name: '【大一】', desc: '1 以 10 點計算', price: 10, rarity: 1 },
    { id: 'b2', name: '【大二】', desc: '2 以 10 點計算', price: 10, rarity: 1 },
    { id: 'b3', name: '【大三】', desc: '3 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b4', name: '【大四】', desc: '4 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b5', name: '【大五】', desc: '5 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b6', name: '【大六】', desc: '6 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b7', name: '【大七】', desc: '7 以 12 點計算', price: 10, rarity: 1 },
    { id: 'b8', name: '【大八】', desc: '8 以 12 點計算', price: 10, rarity: 1 },
    
    // 區段倍率類 (Rarity 2)
    { id: 'small', name: '【小小】', desc: '1,2,3 的點數倍率*5', price: 15, rarity: 2 },
    { id: 'mid', name: '【中中】', desc: '4,5 的點數倍率*4.5', price: 15, rarity: 2 },
    { id: 'big', name: '【大大】', desc: '6,7,8 的點數倍率*4', price: 15, rarity: 2 },
    
    // 條件倍率類 (Rarity 3)
    { id: 'odd', name: '【奇數】', desc: '奇數點數倍率*2.5', price: 25, rarity: 3 },
    { id: 'even', name: '【偶數】', desc: '偶數點數倍率*2.5', price: 25, rarity: 3 },
    { id: 'coin', name: '【幸運金幣】', desc: '結算時獲得金幣 +15', price: 20, rarity: 3 },
    { id: 'order', name: '【寬容】', desc: '只要七顆奇數或偶數就會發動絕對秩序牌型', price: 25, rarity: 3 },
    { id: 'allin', name: '【孤注一擲】', desc: '當玩家 HP 只剩 1 時，最終傷害 x2.5', price: 30, rarity: 3 },
    
    // 其他新增遺物
    { id: 'laststand', name: '【破釜沉舟】', desc: '當剩餘重骰次數為 0 時，最終結算傷害 x1.5', price: 20, rarity: 2 },
    { id: 'investor', name: '【投資達人】', desc: '戰鬥結算時，每持有 10 枚金幣，就額外獲得 1 枚金幣利息', price: 25, rarity: 2 },
    { id: 'highlow', name: '【高低差】', desc: '只要盤面同時存在 1 和 8，總傷害 x1.5', price: 20, rarity: 2 },

    // 傳說類 (Rarity 4)
    { id: 'pansy', name: '【雷爪獅的祝福】', desc: '場上有 1 時總傷害 x3', price: 50, rarity: 4 },
    { id: 'pongo', name: '【捧夠的祝福】', desc: '場上有 8 時總傷害 x3', price: 50, rarity: 4 },
    { id: 'refresh', name: '【刷新幣】', desc: '初始重骰次數 +2', price: 35, rarity: 4 },
    { id: 'goldendice', name: '【黃金骰子】', desc: '每次發動攻擊時，盤面上每有一顆 7，立即獲得 3 金幣', price: 40, rarity: 4 },
];

export const ENEMY_DB = [
    { name: '史萊姆', hp: 1000, turns: 3 },
    { name: '哥布林小隊', hp: 4000, turns: 3 },
    { name: '巨石傀儡 (菁英)', hp: 16000, turns: 4 },
    { name: '深淵魔龍', hp: 80000, turns: 4 },
    { name: '創世神 (最終Boss)', hp: 500000, turns: 5 },
];

export const SHACKLE_DB = [
    // 輕度枷鎖 (Light Shackles)
    { id: 'bluff', name: '【虛張聲勢】', desc: '結算時隱藏預估造成的最終傷害數值。', type: 'light' },
    { id: 'sticky', name: '【黏稠液體】', desc: '每次鎖定骰子時，必須花費 1 金幣。', type: 'light' },
    { id: 'greedy', name: '【貪婪稅】', desc: '每次重骰需額外花費 2 金幣。', type: 'light' },
    { id: 'vampire', name: '【吸血鬼】', desc: '如果在敵方回合結束時仍未將其擊敗，失去 5 金幣。', type: 'light' },
    { id: 'rusty', name: '【生鏽的鎖】', desc: '每回合的第一次鎖定，如果金幣為 0，則扣除 1 HP。', type: 'light' },

    // 重度枷鎖 (Heavy Shackles)
    { id: 'fragile', name: '【易碎骰子】', desc: '完全無法使用鎖定功能。', type: 'heavy' },
    { id: 'fatigue', name: '【沉重疲勞】', desc: '玩家的最大重骰次數 - 1。', type: 'heavy' },
    { id: 'isolated', name: '【孤立無援】', desc: 'A區 (同數頻率) 的倍率減半。', type: 'heavy' },
    { id: 'banality', name: '【平庸之惡】', desc: 'D區 (極端盤面) 的倍率強制為 1.0。', type: 'heavy' },
    { id: 'timecompress', name: '【時間壓縮】', desc: '此關卡的限制回合強制縮減為 2 回合。', type: 'heavy' }
];

export function getEnemy(levelIndex) {
    if (levelIndex < ENEMY_DB.length) {
        return ENEMY_DB[levelIndex];
    } else {
        let baseHp = ENEMY_DB[ENEMY_DB.length - 1].hp;
        let infiniteLevel = levelIndex - ENEMY_DB.length + 1;

        // n-m format
        let n = Math.floor((infiniteLevel - 1) / 3) + 1;
        let m = ((infiniteLevel - 1) % 3) + 1;

        let hp = Math.floor(baseHp * Math.pow(1.5, infiniteLevel));

        let name = `無限塔 ${n}-${m}`;
        if (m === 3) name += ' (Boss)';
        else if (m === 2) name += ' (菁英)';

        return { name: name, hp: hp, turns: 5 };
    }
}

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
        { name: '大滿貫', desc: '1~8各有一顆', multi: 'x25.0' },
        { name: '三龍會', desc: '分成三組完全相連的順子', multi: 'x12.0' },
        { name: '七連順', desc: '7顆數字相連', multi: 'x10.0' },
        { name: '六連順', desc: '6顆數字相連', multi: 'x6.0' },
        { name: '雙順', desc: '兩組4連順', multi: 'x6.0' },
        { name: '五連順', desc: '5顆數字相連', multi: 'x3.5' },
        { name: '雙三連順', desc: '兩組3連順', multi: 'x3.0' },
        { name: '四連順', desc: '4顆數字相連', multi: 'x2.5' },
        { name: '三連順', desc: '3顆數字相連', multi: 'x2.0' }
    ],
    groupC: [
        { name: '雙子星', desc: '兩組4同', multi: 'x20.0' },
        { name: '葫蘆', desc: '5同 + 3同', multi: 'x15.0' },
        { name: '豪華四對子', desc: '包含3同或4同的4組對子', multi: 'x15.0' },
        { name: '經典四對子', desc: '嚴格的4組對子(無3同或4同)', multi: 'x10.0' },
        { name: '中葫蘆', desc: '4同 + 3同', multi: 'x8.0' },
        { name: '平胡', desc: '兩組3連順 + 一組對子', multi: 'x6.0' },
        { name: '碰碰胡', desc: '兩組3同 + 一組對子', multi: 'x5.0' },
        { name: '順碰交響曲', desc: '1組3連順 + 1組3同', multi: 'x4.0' },
        { name: '雙三同', desc: '兩組3同', multi: 'x3.5' },
        { name: '小葫蘆', desc: '3同 + 一組對子', multi: 'x3.5' },
        { name: '三對子', desc: '任意3組對子', multi: 'x3.0' },
        { name: '雙對子', desc: '任意2組對子', multi: 'x2.0' }
    ],
    groupD: [
        { name: '兩極', desc: '盤面只有 1 和 8', multi: 'x30.0' },
        { name: '絕對秩序', desc: '7顆以上數字為全奇數或全偶數', multi: 'x8.0' },
        { name: '全異', desc: '8顆數字皆不相同', multi: 'x2.5' },
        { name: '中庸之道', desc: '盤面完全沒有 1 和 8', multi: 'x2.0' }
    ]
};