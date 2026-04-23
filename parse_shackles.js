const fs = require('fs');

const text = fs.readFileSync('shackles_list.csv', 'utf8');
const lines = text.trim().split('\n').slice(1);

const idMap = {
    '【盲眼】': 'blind',
    '【虛張聲勢】': 'bluff',
    '【幻象】': 'illusion',
    '【深海恐懼】': 'thalassophobia',
    '【顛倒是非】': 'inversion',
    '【暈眩】': 'dizziness',
    '【噪音】': 'noise',
    '【黏稠液體】': 'sticky',
    '【貪婪稅】': 'greedy',
    '【吸血鬼】': 'vampire',
    '【小偷】': 'thief',
    '【通膨】': 'inflation',
    '【同化】': 'assimilation',
    '【生鏽的鎖】': 'rusty',
    '【叛逆】': 'rebel',
    '【手抖】': 'tremor',
    '【鐵壁】': 'ironwall',
    '【貪吃】': 'gluttony',
    '【治癒之骰】': 'healingdice',
    '【偏食】': 'pickyeater',
    '【短路】': 'shortcircuit',
    '【霉運】': 'badluck',
    '【沉溺】': 'drowning',
    '【孤立】': 'lonely',
    '【詛咒之鎖】': 'cursedlock',
    '【易碎骰子】': 'fragile',
    '【沉重疲勞】': 'fatigue',
    '【命運枷鎖】': 'destinychain',
    '【終極封鎖】': 'ultimatelock',
    '【強制轉換】': 'forcedshift',
    '【奇/偶數恐懼】': 'parityfear',
    '【數字掠奪】': 'numberplunder',
    '【孤立無援】': 'isolated',
    '【秩序崩壞】': 'ordercollapse',
    '【平庸之惡】': 'banality',
    '【混沌法則】': 'chaoslaw',
    '【封印之門】': 'sealeddoor',
    '【黑洞】': 'blackhole',
    '【上限鎖死】': 'hardcap',
    '【遺物封印】': 'relicseal',
    '【忘卻】': 'oblivion',
    '【剝削】': 'exploitation',
    '【天譴】': 'wrath',
    '【時間壓縮】': 'timecompress',
    '【反傷裝甲】': 'thornarmor',
    '【絕對屏障】': 'absolutebarrier',
    '【深淵凝視】': 'abyssgaze',
    '【枯萎】': 'wither',
    '【同歸於盡】': 'mutualdestruction'
};

let jsOutput = "export const SHACKLE_DB = [\n";

lines.forEach(line => {
    let [typeStr, name, desc] = line.split(',');
    if (!typeStr) return;
    
    let type = typeStr.includes('輕度') ? 'light' : 'heavy';
    let id = idMap[name] || 'unknown';
    
    jsOutput += `    { id: '${id}', name: '${name}', desc: '${desc}', type: '${type}' },\n`;
});

jsOutput += "];\n";

fs.writeFileSync('shackles_out.txt', jsOutput);
console.log('Done!');
