// js/data.js

export const RARITY = {
    1: { label: '普通', color: 'text-slate-300', bg: 'bg-slate-700/50', border: 'border-slate-500' },
    2: { label: '稀有', color: 'text-blue-400', bg: 'bg-blue-900/40', border: 'border-blue-600' },
    3: { label: '史詩', color: 'text-purple-400', bg: 'bg-purple-900/40', border: 'border-purple-600' },
    4: { label: '傳說', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-500' },
    5: { label: '再生', color: 'text-cyan-400', bg: 'bg-cyan-900/40', border: 'border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' }
};


export const FUSION_RECIPES = {
    'fusion_source': { mat1: 'b1', mat2: 'b2' },
    'fusion_pillar': { mat1: 'b4', mat2: 'b5' },
    'fusion_peak': { mat1: 'b7', mat2: 'b8' },
    'fusion_nebula': { mat1: 'b3', mat2: 'small' },
    'fusion_samsara': { mat1: 'b6', mat2: 'sixsmooth' },
    'fusion_recycle': { mat1: 'scavenger', mat2: 'vip' },
    'fusion_fortune': { mat1: 'mid', mat2: 'fivebless' },
    'fusion_miser': { mat1: 'piggybank', mat2: 'investor' },
    'fusion_arithmetic': { mat1: 'arithmetic', mat2: 'fourdeath' },
    'fusion_empire': { mat1: 'bounty', mat2: 'coin' },
    'fusion_bloody': { mat1: 'doubleedge', mat2: 'luckyseven' },
    'fusion_chaos': { mat1: 'odd', mat2: 'even' },
    'fusion_scales': { mat1: 'order', mat2: 'extremist' },
    'fusion_ares': { mat1: 'allin', mat2: 'highlow' },
    'fusion_eternity': { mat1: 'brink', mat2: 'oneshot' },
    'fusion_glimmer': { mat1: 'flicker', mat2: 'doubles' },
    'fusion_miracle': { mat1: 'hodgepodge', mat2: 'mediocre' },
    'fusion_titan': { mat1: 'big', mat2: 'laststand' },
    'fusion_infinite': { mat1: 'straightfan', mat2: 'rebel' }
};

export const RELIC_DB = [
    { id: 'b1', name: '【大一】', desc: '1 以 10 點計算', price: 10, rarity: 1 },
    { id: 'b2', name: '【大二】', desc: '2 以 10 點計算', price: 10, rarity: 1 },
    { id: 'b3', name: '【大三】', desc: '3 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b4', name: '【大四】', desc: '4 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b5', name: '【大五】', desc: '5 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b6', name: '【大六】', desc: '6 以 11 點計算', price: 10, rarity: 1 },
    { id: 'b7', name: '【大七】', desc: '7 以 12 點計算', price: 10, rarity: 1 },
    { id: 'b8', name: '【大八】', desc: '8 以 12 點計算', price: 10, rarity: 1 },
    { id: 'scavenger', name: '【拾荒者】', desc: '在商店刷新商品的價格-2金幣。第一次免費以外，最低1金幣。', price: 10, rarity: 1 },
    { id: 'small', name: '【小小】', desc: '1, 2, 3 的點數倍率 * 5', price: 15, rarity: 2 },
    { id: 'mid', name: '【中中】', desc: '4, 5 的點數倍率 * 3', price: 15, rarity: 2 },
    { id: 'big', name: '【大大】', desc: '6, 7, 8 的點數倍率 * 2', price: 15, rarity: 2 },
    { id: 'piggybank', name: '【存錢筒】', desc: '每次擊敗敵人獲得 5 枚金幣，但你在戰鬥中每次點擊「重骰」需支付 1 枚金幣。', price: 15, rarity: 2 },
    { id: 'flicker', name: '【凡人微光】', desc: '若結算時 A 區最高牌型只有「對子」（且無 C、D 區），最終倍率強制 +3.0x。', price: 15, rarity: 2 },
    { id: 'laststand', name: '【破釜沉舟】', desc: '當剩餘重骰次數為 0 時，最終結算傷害 x1.5', price: 20, rarity: 2 },
    { id: 'highlow', name: '【高低差】', desc: '只要盤面同時存在 1 和 8，總傷害 x1.5', price: 20, rarity: 2 },
    { id: 'hodgepodge', name: '【大雜燴】', desc: '若盤面結算時同時觸發了 A 區、B 區、C 區的有效牌型，總基礎點數額外 +100。', price: 20, rarity: 2 },
    { id: 'doubles', name: '【雙打冠軍】', desc: '「對子」、「雙對子」、「三對子」的倍率強制翻倍。', price: 20, rarity: 2 },
    { id: 'fivebless', name: '【五福臨門】', desc: '盤面上每有一顆 5，最終總倍率增加 +0.2x。', price: 20, rarity: 2 },
    { id: 'mediocre', name: '【平庸之善】', desc: '若你的結算倍率低於 x5.0，強制將總倍率提升至 x5.0。', price: 20, rarity: 2 },
    { id: 'investor', name: '【投資達人】', desc: '戰鬥結算時，每持有 10 枚金幣，就額外獲得 1 枚金幣利息', price: 25, rarity: 2 },
    { id: 'arithmetic', name: '【等差數列】', desc: '盤面上每多一種「不同的數字」，最終結算的基礎點數總和 +8。', price: 25, rarity: 2 },
    { id: 'bounty', name: '【賞金獵人】', desc: '若能在「1 回合內」秒殺敵人，額外獲得 20 金幣。', price: 25, rarity: 2 },
    { id: 'coin', name: '【幸運金幣】', desc: '結算時獲得金幣 +15', price: 20, rarity: 3 },
    { id: 'doubleedge', name: '【雙面刃】', desc: '盤面上所有的 2 基礎點數以 20 計算，但所有的 3 基礎點數歸零。', price: 20, rarity: 3 },
    { id: 'odd', name: '【奇數】', desc: '奇數點數倍率 * 2.5', price: 25, rarity: 3 },
    { id: 'even', name: '【偶數】', desc: '偶數點數倍率 * 2.5', price: 25, rarity: 3 },
    { id: 'sixsmooth', name: '【六六大順】', desc: '只要盤面上有 6，所有「散牌」（未湊成牌型的骰子）基礎點數強制以 15 點計算。', price: 25, rarity: 3 },
    { id: 'order', name: '【寬容】', desc: '只要七顆奇數或偶數就會發動絕對秩序牌型', price: 30, rarity: 3 },
    { id: 'allin', name: '【孤注一擲】', desc: '當玩家 HP 只剩 1 時，最終傷害 x2.5', price: 30, rarity: 3 },
    { id: 'brink', name: '【極限拉扯】', desc: '若發動攻擊時，剩餘發動攻擊次數（turnsLeft）剛好為 1，最終傷害 x2.5。', price: 30, rarity: 3 },
    { id: 'straightfan', name: '【順子愛好者】', desc: '只要觸發 B 區（順子連號）的任何牌型，該牌型倍率額外 +2.0。', price: 30, rarity: 3 },
    { id: 'fourdeath', name: '【四死如歸】', desc: '只要盤面上「剛好」有四顆 4，總倍率 x4.0。', price: 30, rarity: 3 },
    { id: 'vip', name: '【VIP會員】', desc: '商店內所有遺物的價格降低 20%（向下取整）。', price: 30, rarity: 3 },
    { id: 'oneshot', name: '【一發入魂】', desc: '若發動攻擊時「完全沒有消耗過重骰次數」，最終總倍率 x3.0。', price: 35, rarity: 3 },
    { id: 'extremist', name: '【極端份子】', desc: 'D 區（極端盤面）的所有結算倍率 x1.5。', price: 35, rarity: 3 },
    { id: 'luckyseven', name: '【幸運七】', desc: '盤面上每有一顆 7，結算時基礎點數額外 +77。', price: 35, rarity: 3 },
    { id: 'rebel', name: '【反抗軍】', desc: '若本關卡存在任何「枷鎖」，最終總倍率 x1.5。', price: 35, rarity: 3 },
    { id: 'refresh', name: '【刷新幣】', desc: '初始重骰次數 +2', price: 40, rarity: 4 },
    { id: 'goldendice', name: '【黃金骰子】', desc: '每次發動攻擊時，盤面每有一顆 7，立即獲得 3 金幣', price: 40, rarity: 4 },
    { id: 'balance', name: '【動態平衡】', desc: '每回合的「第一次重骰」不消耗重骰次數。', price: 45, rarity: 4 },
    { id: 'pansy', name: '【雷爪獅的祝福】', desc: '場上有 1 時總傷害 x3', price: 50, rarity: 4 },
    { id: 'pongo', name: '【捧夠的祝福】', desc: '場上有 8 時總傷害 x3', price: 50, rarity: 4 },
    { id: 'firstaid', name: '【急救包】', desc: '每次擊敗【菁英怪】或【Boss】時，若 HP 不滿，恢復 1 點 HP。', price: 50, rarity: 4 },
    { id: 'royalflush', name: '【同花順】', desc: '若本次攻擊「同時」觸發了 A 區（同數）與 B 區（順子），總倍率 x2.0。', price: 50, rarity: 4 },
    { id: 'berserker', name: '【越戰越勇】', desc: '每次因回合耗盡或反傷扣除 1 HP 時，永久增加 1 次初始重骰次數。', price: 55, rarity: 4 },
    { id: 'dragonslayer', name: '【屠龍者】', desc: '面對「Boss」或「菁英怪」時，總傷害 x1.5。', price: 60, rarity: 4 },
    { id: 'bankrupt', name: '【破財消災】', desc: '承受致命傷害時，若金幣 ≥ 100，扣除【所有金幣】並保留 1 HP（每局限一次）。', price: 70, rarity: 4 },

    { id: 'fusion_source', name: '【萬物之源】', desc: '1, 2 的點數隨關卡層數(E)成長。公式：15+(E×2.5)。', price: 0, rarity: 5 },
    { id: 'fusion_pillar', name: '【中流砥柱】', desc: '4, 5 的點數倍率為 3x。每擊破一隻敵人，此倍率永久增加 +0.2x。', price: 0, rarity: 5 },
    { id: 'fusion_peak', name: '【登峰造極】', desc: '7, 8 點數隨「目前持有的金幣」成長（每 20 金幣，基礎點數 +5）。', price: 0, rarity: 5 },
    { id: 'fusion_nebula', name: '【微縮星雲】', desc: '1, 2, 3 的倍率隨「目前無標籤骰子數」成長（每有一顆散牌，倍率 +1.0x）。', price: 0, rarity: 5 },
    { id: 'fusion_samsara', name: '【六道輪迴】', desc: '散牌點數基礎為 20。盤面上每多一顆 6，此數值隨關卡層數(E)額外增加。', price: 0, rarity: 5 },
    { id: 'fusion_recycle', name: '【回收領主】', desc: '刷新商店不花錢。且每次點擊刷新，該局全域傷害永久 +1%。', price: 0, rarity: 5 },
    { id: 'fusion_fortune', name: '【五福中天】', desc: '4, 5 的倍率隨「5 的出現次數」累計成長。每出現過一次 5，倍率 +0.05x。', price: 0, rarity: 5 },
    { id: 'fusion_miser', name: '【黃金守財奴】', desc: '取消重骰扣錢。每回合結束時，根據持有金幣獲得「複利」傷害加成。', price: 0, rarity: 5 },
    { id: 'fusion_arithmetic', name: '【等差死神】', desc: '每多一種數字，點數總和隨關卡層數(E)成長（+8×E）。', price: 0, rarity: 5 },
    { id: 'fusion_empire', name: '【帝國遺產】', desc: '戰鬥金幣獎勵隨「總累積金幣」成長（每賺過 1000 金，傷害 +20%）。', price: 0, rarity: 5 },
    { id: 'fusion_bloody', name: '【血色聖戰】', desc: '2 的點數為 30。且每失去 1 點 HP，所有骰子基礎點數永久 +10。', price: 0, rarity: 5 },
    { id: 'fusion_chaos', name: '【混沌原力】', desc: '奇偶共生：若盤面 4 奇 4 偶，倍率隨「已擁有的遺物數量」成長。', price: 0, rarity: 5 },
    { id: 'fusion_scales', name: '【天秤之極】', desc: '絕對秩序門檻降至 6。倍率隨「已損生命值」成長（1 HP 時倍率翻 3 倍）。', price: 0, rarity: 5 },
    { id: 'fusion_ares', name: '【孤傲戰神】', desc: '若同時存在 1 和 8，傷害隨關卡層數(E)指數成長（1.5E）。', price: 0, rarity: 5 },
    { id: 'fusion_eternity', name: '【一念永恆】', desc: '最後一擊且為無標籤時，傷害乘上「剩餘重骰次數的平方」。', price: 0, rarity: 5 },
    { id: 'fusion_glimmer', name: '【微光聖戰】', desc: '弱勢牌型（對子）倍率隨「對戰回合數」成長。戰鬥拖越久，傷害越高。', price: 0, rarity: 5 },
    { id: 'fusion_miracle', name: '【凡骨奇蹟】', desc: '無標籤時，傷害隨「目前解鎖的牌型數量」成長。', price: 0, rarity: 5 },
    { id: 'fusion_titan', name: '【泰坦之握】', desc: '6, 7, 8 基礎點數隨關卡層數(E)翻倍。對 Boss 傷害隨關卡額外增幅。', price: 0, rarity: 5 },
    { id: 'fusion_infinite', name: '【無限數列】', desc: '順子倍率隨擊殺數成長。', price: 0, rarity: 5 },

];

export const ENEMY_DB = [
    { name: '史萊姆', hp: 1000, turns: 3 },                  // Stage 1 (Index 0)
    { name: '哥布林', hp: 2500, turns: 3 },                  // Stage 2 (Index 1)
    { name: '巨石傀儡 (菁英)', hp: 6000, turns: 3 },           // Stage 3 (Index 2)
    { name: '幽暗衛士', hp: 12000, turns: 3 },               // Stage 4 (Index 3)
    { name: '吸血鬼男爵', hp: 25000, turns: 3 },             // Stage 5 (Index 4)
    { name: '深淵魔龍 (菁英)', hp: 55000, turns: 3 },          // Stage 6 (Index 5)
    { name: '墮落天使', hp: 100000, turns: 3 },              // Stage 7 (Index 6)
    { name: '虛空行者', hp: 200000, turns: 3 },              // Stage 8 (Index 7)
    { name: '混沌騎士 (菁英)', hp: 320000, turns: 3 },         // Stage 9 (Index 8)
    { name: '創世神 (最終Boss)', hp: 500000, turns: 3 },     // Stage 10 (Index 9)
];

export const SHACKLE_DB = [
    { id: 'blind', name: '【盲眼】', desc: '隨機覆蓋 2 顆骰子面值為「？」，點擊攻擊時才揭曉。', type: 'light' },
    { id: 'bluff', name: '【虛張聲勢】', desc: '隱藏畫面中央的「預估造成傷害」數字。', type: 'light' },
    { id: 'illusion', name: '【幻象】', desc: '盤面所有未鎖定的骰子視覺上顯示為相同數字。', type: 'light' },
    { id: 'thalassophobia', name: '【深海恐懼】', desc: '盤面的骰子數值會不定時閃爍消失 1 秒。', type: 'light' },
    { id: 'inversion', name: '【顛倒是非】', desc: '骰子的顏色樣式隨機錯亂（例如 1 變成紅底）。', type: 'light' },
    { id: 'dizziness', name: '【暈眩】', desc: '每次鎖定/解鎖骰子，盤面上所有骰子位置大洗牌。', type: 'light' },
    { id: 'noise', name: '【噪音】', desc: '本局戰鬥中所有遺物的效果變成????，並且無法點擊觀看效果。', type: 'light' },
    { id: 'amnesia', name: '【健忘】', desc: '隱藏本局戰鬥中的牌型及加成，但加成效果依然擁有。', type: 'light' },

    { id: 'sticky', name: '【黏稠液體】', desc: '依鎖定骰子數量，在重骰的瞬間，需支付同等骰子數量的金幣（金幣不足無法擲骰）。', type: 'light' },
    { id: 'greedy', name: '【貪婪稅】', desc: '點擊「重骰」需額外消耗 2 枚金幣。', type: 'light' },
    { id: 'vampire', name: '【吸血鬼】', desc: '敵人回合結束時若未死，偷取玩家 5 枚金幣。', type: 'light' },
    { id: 'thief', name: '【小偷】', desc: '玩家若未在當前攻擊擊敗敵人，額外失去 2 枚金幣。', type: 'light' },
    { id: 'inflation', name: '【通膨】', desc: '擊敗此敵人後的下一間商店，所有物品價格提升 20%。', type: 'light' },
    { id: 'assimilation', name: '【同化】', desc: '戰鬥結束時若金幣 > 50，超出部分強制歸零。', type: 'light' },
    { id: 'rusty', name: '【生鏽的鎖】', desc: '本局戰鬥中最多鎖定六顆骰子。', type: 'light' },
    { id: 'rebel', name: '【叛逆】', desc: '點擊重骰時，已鎖定的骰子有 15% 機率「掙脫」並重骰。', type: 'light' },
    { id: 'tremor', name: '【手抖】', desc: '攻擊結算時，有 10% 機率強制重骰 1 顆未鎖定的骰子。', type: 'light' },
    { id: 'ironwall', name: '【鐵壁】', desc: '最終攻擊時，減少 20% 傷害量。', type: 'heavy' },
    { id: 'gluttony', name: '【貪吃】', desc: '敵人每回合開始時，自動恢復自身最大 HP 的 3%。', type: 'light' },
    { id: 'healingdice', name: '【治癒之骰】', desc: '結算時盤面每有一顆「2」，敵人恢復最大生命值的 3%。', type: 'light' },
    { id: 'pickyeater', name: '【偏食】', desc: '擊敗該敵人掉落的基礎金幣獎勵減少 30%。', type: 'light' },
    { id: 'shortcircuit', name: '【短路】', desc: '最終總倍率（Global Multiplier）固定減少 0.5x。', type: 'light' },
    { id: 'badluck', name: '【霉運】', desc: '結算時盤面每有一顆「1」，最終倍率扣除 0.1x。', type: 'light' },
    { id: 'drowning', name: '【沉溺】', desc: '骰子點數「5」的基礎點數歸零。', type: 'light' },
    { id: 'lonely', name: '【孤立】', desc: '盤面上沒有湊成任何牌型的「散牌」，不提供基礎點數。', type: 'light' },
    { id: 'cursedlock', name: '【詛咒之鎖】', desc: '每回合強制鎖定 1 顆點數最小的骰子，且無法解鎖。', type: 'heavy' },
    { id: 'fragile', name: '【易碎骰子】', desc: '本局戰鬥中完全停用「鎖定」功能，每次皆 8 顆全換。', type: 'heavy' },
    { id: 'fatigue', name: '【沉重疲勞】', desc: '玩家的初始最大重骰次數直接減 1。', type: 'heavy' },
    { id: 'destinychain', name: '【命運枷鎖】', desc: '玩家每回合最高只能重骰 1 次（無視遺物加成）。', type: 'heavy' },
    { id: 'ultimatelock', name: '【終極封鎖】', desc: '盤面正中間的 4 顆骰子位置永遠無法被鎖定。', type: 'heavy' },
    { id: 'forcedshift', name: '【強制轉換】', desc: '每次重骰結束後，系統隨機將 1 顆「已鎖定」骰子變更數值。', type: 'heavy' },
    { id: 'parityfear', name: '【奇/偶數恐懼】', desc: '盤面上所有的奇數（或偶數）基礎點數歸零，且不觸發遺物倍率。', type: 'heavy' },
    { id: 'numberplunder', name: '【數字掠奪】', desc: '開局指定一個數字（如 7），本局擲出該數字皆視為廢牌，不計入牌型。', type: 'heavy' },
    { id: 'isolated', name: '【孤立無援】', desc: 'A 區（同數頻率）的所有倍率強制減半。', type: 'heavy' },
    { id: 'ordercollapse', name: '【秩序崩壞】', desc: 'B 區（順子連號）的倍率判定完全失效。', type: 'heavy' },
    { id: 'banality', name: '【平庸之惡】', desc: 'D 區（極端盤面）的所有特殊倍率強制失效。', type: 'heavy' },
    { id: 'chaoslaw', name: '【混沌法則】', desc: 'A 區（同數）與 B 區（順子）的倍率計算表互相對調。', type: 'heavy' },
    { id: 'sealeddoor', name: '【封印之門】', desc: '盤面必須包含「對子」以上的同數牌型，否則本次攻擊傷害歸零。', type: 'heavy' },
    { id: 'blackhole', name: '【黑洞】', desc: '骰子點數「8」在攻擊結算時會強制被吸走，變成「1」。', type: 'heavy' },
    { id: 'hardcap', name: '【上限鎖死】', desc: '最多只能同時鎖定四顆骰子。', type: 'heavy' },
    { id: 'relicseal', name: '【遺物封印】', desc: '戰鬥期間，隨機使玩家背包中的 2 個遺物效果暫停運作。', type: 'heavy' },
    { id: 'oblivion', name: '【忘卻】', desc: '無視所有來自遺物的「基礎點數」加成（如大一到大八）。', type: 'heavy' },
    { id: 'exploitation', name: '【剝削】', desc: '所有遺物的觸發倍率效果強制減半（例如 x3.0 變 x1.5）。', type: 'heavy' },
    { id: 'wrath', name: '【天譴】', desc: '若結算時觸發傳說牌型，強制扣除 1 HP。', type: 'heavy' },
    { id: 'timecompress', name: '【時間壓縮】', desc: '該關卡的限制回合數強制改為只有 2 回合。', type: 'heavy' },
    { id: 'thornarmor', name: '【反傷裝甲】', desc: '若單回合傷害低於敵人最大 HP 的 10%，玩家受 1 HP 反傷。', type: 'heavy' },
    { id: 'absolutebarrier', name: '【絕對屏障】', desc: '本局戰鬥中的「第一次攻擊」強制無效（造成 0 點傷害）。', type: 'heavy' },
    { id: 'abyssgaze', name: '【深淵凝視】', desc: '若單次攻擊未打掉 Boss 20% 最大 HP，該次傷害轉為治療 Boss。', type: 'heavy' },
    { id: 'wither', name: '【枯萎】', desc: '本局戰鬥玩家最大 HP 視為 1（受傷即死）。', type: 'heavy' },
    { id: 'mutualdestruction', name: '【同歸於盡】', desc: '敵人會將受到的 5% 傷害反彈給玩家，但不會導致玩家死亡（最少剩 1 HP）。', type: 'heavy' }
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
        { name: '八重奏', desc: '8顆相同數字', multi: 'x50.0' , rarity: 4 },
        { name: '七同', desc: '7顆相同數字', multi: 'x25.0' , rarity: 4 },
        { name: '六同', desc: '6顆相同數字', multi: 'x12.0' , rarity: 3 },
        { name: '五同', desc: '5顆相同數字', multi: 'x6.0' , rarity: 3 },
        { name: '四同', desc: '4顆相同數字', multi: 'x4.5' , rarity: 2 },
        { name: '三同', desc: '3顆相同數字', multi: 'x2.5' , rarity: 2 },
        { name: '對子', desc: '2顆相同數字', multi: 'x1.5' , rarity: 1 }
    ],
    groupB: [
        { name: '大滿貫', desc: '1~8各有一顆', multi: 'x25.0' , rarity: 4 },
        { name: '七連順', desc: '7顆數字相連', multi: 'x10.0' , rarity: 3 },
        { name: '六連順', desc: '6顆數字相連', multi: 'x6.0' , rarity: 3 },
        { name: '五連順', desc: '5顆數字相連', multi: 'x3.5' , rarity: 2 },
        { name: '四連順', desc: '4顆數字相連', multi: 'x2.5' , rarity: 2 },
        { name: '三連順', desc: '3顆數字相連', multi: 'x2.0' , rarity: 1 }
    ],
    groupC: [
        { name: '雙子星', desc: '兩組4同', multi: 'x20.0' , rarity: 4 },
        { name: '葫蘆', desc: '5同 + 3同', multi: 'x15.0' , rarity: 3 },
        { name: '豪華四對子', desc: '包含3同或4同的4組對子', multi: 'x15.0' , rarity: 3 },
        { name: '三龍會', desc: '分成三組完全相連的順子', multi: 'x12.0' , rarity: 3 },
        { name: '經典四對子', desc: '嚴格的4組對子(無3同或4同)', multi: 'x10.0' , rarity: 2 },
        { name: '雙四連順', desc: '兩組4連順', multi: 'x10.0' , rarity: 2 },
        { name: '中葫蘆', desc: '4同 + 3同', multi: 'x8.0' , rarity: 2 },
        { name: '平胡', desc: '兩組3連順 + 一組對子', multi: 'x6.0' , rarity: 2 },
        { name: '碰碰胡', desc: '兩組3同 + 一組對子', multi: 'x5.0' , rarity: 2 },
        { name: '順碰交響曲', desc: '1組3連順 + 1組3同', multi: 'x4.0' , rarity: 1 },
        { name: '雙三連順', desc: '兩組3連順', multi: 'x4.0' , rarity: 1 },
        { name: '雙三同', desc: '兩組3同', multi: 'x3.5' , rarity: 1 },
        { name: '小葫蘆', desc: '3同 + 一組對子', multi: 'x3.5' , rarity: 1 },
        { name: '三對子', desc: '任意3組對子', multi: 'x3.0' , rarity: 1 },
        { name: '雙對子', desc: '任意2組對子', multi: 'x2.0' , rarity: 1 }
    ],
    groupD: [
        { name: '兩極', desc: '盤面只有 1 和 8', multi: 'x30.0' , rarity: 4 },
        { name: '絕對秩序', desc: '7顆以上數字為全奇數或全偶數', multi: 'x8.0' , rarity: 3 },
        { name: '全異', desc: '8顆數字皆不相同', multi: 'x2.5' , rarity: 2 },
        { name: '中庸之道', desc: '盤面完全沒有 1 和 8', multi: 'x2.0' , rarity: 1 }
    ]
};