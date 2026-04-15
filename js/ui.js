// js/ui.js
import { RARITY, RELIC_DB, ENEMY_DB, RULE_DB } from './data.js';

// 緩存 DOM 元素
export const el = {
    stageInfo: document.getElementById('stage-info'),
    playerHp: document.getElementById('player-hp'),
    playerGold: document.getElementById('player-gold'),
    enemyName: document.getElementById('enemy-name'),
    enemyHpBar: document.getElementById('enemy-hp-bar'),
    enemyHpText: document.getElementById('enemy-hp-text'),
    turnsLeft: document.getElementById('turns-left'),
    diceContainer: document.getElementById('dice-container'),
    controlsContainer: document.getElementById('controls-container'),
    rollsBadge: document.getElementById('rolls-left-badge'),
    inventoryGrid: document.getElementById('inventory-grid'),
    scoreDisplay: document.getElementById('score-display'),
    finalScoreValue: document.getElementById('final-score-value'), // ★ 新增綁定：最終傷害數字
    battleArea: document.getElementById('battle-area'),
    rulesModal: document.getElementById('rules-modal'),
    rulesContent: document.getElementById('rules-content'),
    shopOverlay: document.getElementById('shop-overlay'),
    shopGold: document.getElementById('shop-gold'),
    shopItemsContainer: document.getElementById('shop-items'),
    shopRerollBtn: document.getElementById('shop-reroll-btn'),
    endOverlay: document.getElementById('end-overlay'),
    endTitle: document.getElementById('end-title'),
    endDesc: document.getElementById('end-desc'),
    damageContainer: document.getElementById('damage-container'),
    hitFlash: document.getElementById('hit-flash'),
    titleScreen: document.getElementById('title-screen'),
    btnContinue: document.getElementById('btn-continue'),
    btnNewGame: document.getElementById('btn-new-game')
};

// --- 動畫與特效 ---
export function shootConfetti() {
    if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f87171', '#60a5fa', '#34d399'] });
}

export function showToast(msg, callback) {
    let toast = document.createElement('div');
    toast.className = 'fixed top-1/2 left-1/2 bg-slate-800 text-white font-bold py-5 px-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-amber-500 z-[100] text-2xl md:text-3xl text-center flex flex-col gap-2 toast-enter whitespace-pre-wrap';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.opacity = '0';
        setTimeout(() => { toast.remove(); if(callback) callback(); }, 300);
    }, 1500);
}

// --- 動態生成牌型表 (字加大) ---
export function renderRulesDB() {
    let html = '';
    const groups = [
        { key: 'groupA', title: '【A區】同數頻率' },
        { key: 'groupB', title: '【B區】順子連號' },
        { key: 'groupC', title: '【C區】複合牌型' },
        { key: 'groupD', title: '【D區】極端盤面' }
    ];
    
    groups.forEach(g => {
        html += `<h3 class="text-base md:text-lg font-black text-slate-300 mt-5 mb-2 border-b border-slate-700 pb-1">${g.title}</h3>`;
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">`;
        RULE_DB[g.key].forEach(rule => {
            html += `
            <div class="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div>
                    <div class="text-sm md:text-base font-bold text-slate-200">${rule.name}</div>
                    <div class="text-xs md:text-sm text-slate-400">${rule.desc}</div>
                </div>
                <div class="text-base md:text-lg font-black text-amber-400">${rule.multi}</div>
            </div>`;
        });
        html += `</div>`;
    });
    el.rulesContent.innerHTML = html;
}

// --- 更新 UI 狀態 ---
export function updateHeaderUI(player, stage) {
    el.stageInfo.innerText = `關卡 ${stage.level + 1} / ${ENEMY_DB.length}`;
    el.playerHp.innerText = `${player.hp}/3`;
    el.playerGold.innerText = player.gold;
}

export function updateEnemyUI(stage) {
    let enemy = ENEMY_DB[stage.level];
    el.enemyName.innerText = `⚔️ ${enemy.name}`;
    if(stage.level === 2) el.enemyName.classList.replace('text-red-300', 'text-purple-400');
    
    el.turnsLeft.innerText = `剩餘 ${stage.turnsLeft} 回合`;
    let pct = Math.max(0, (stage.enemyHp / stage.enemyMaxHp) * 100);
    el.enemyHpBar.style.width = `${pct}%`;
    el.enemyHpText.innerText = `${Math.floor(stage.enemyHp)} / ${stage.enemyMaxHp}`;
}

// --- ★ 任務4：遺物字體加大 ---
export function renderInventory(player) {
    if (player.relics.length === 0) {
        el.inventoryGrid.innerHTML = `<div class="col-span-full text-sm text-slate-500 font-bold p-2">背包空空如也</div>`;
        return;
    }
    let sortedRelics = [...player.relics].sort((a,b) => RELIC_DB.find(x=>x.id===b).rarity - RELIC_DB.find(x=>x.id===a).rarity);
    
    el.inventoryGrid.innerHTML = sortedRelics.map(id => {
        let r = RELIC_DB.find(x => x.id === id);
        let style = RARITY[r.rarity];
        return `
        <div class="${style.bg} p-2.5 rounded-lg border ${style.border} shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start mb-1.5">
                <div class="text-sm font-black ${style.color} leading-tight">${r.name}</div>
                <span class="text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded ${style.color} border ${style.border} opacity-80 font-bold">${style.label}</span>
            </div>
            <div class="text-xs text-slate-300 leading-tight font-bold">${r.desc}</div>
        </div>`;
    }).join('');
}

export function renderDice(battle, activeHighlight) {
    el.diceContainer.innerHTML = battle.dice.map((d, idx) => {
        let wrapperClass = "w-10 h-10 md:w-14 md:h-14 flex items-center justify-center mx-auto my-1";
        let diamondClass = "w-full h-full rotate-45 rounded-xl border-2 flex items-center justify-center shadow-lg transition-all duration-200 relative ";
        let innerClass = "-rotate-45 w-full h-full flex items-center justify-center text-xl md:text-3xl font-black relative z-10";
        let colorClasses = "bg-slate-700 border-slate-500 text-white";

        if(battle.state !== 'IDLE'){
            if (battle.state === 'ROLLING' && !d.locked) {
                diamondClass += "rolling-dice-anim border-dashed ";
                colorClasses = "bg-slate-800 border-slate-500 text-slate-500";
            } else if (battle.state === 'WAIT_ACTION') {
                if (activeHighlight) {
                    if (d.matchedGroups[activeHighlight]) {
                        if (activeHighlight === 'A') colorClasses = "bg-blue-600 border-blue-300 text-white shadow-[0_0_20px_rgba(96,165,250,0.8)] scale-110 z-20";
                        else if (activeHighlight === 'B') colorClasses = "bg-pink-600 border-pink-300 text-white shadow-[0_0_20px_rgba(244,114,182,0.8)] scale-110 z-20";
                        else if (activeHighlight === 'C') colorClasses = "bg-purple-600 border-purple-300 text-white shadow-[0_0_20px_rgba(192,132,252,0.8)] scale-110 z-20";
                        else if (activeHighlight === 'D') colorClasses = "bg-teal-600 border-teal-300 text-white shadow-[0_0_20px_rgba(45,212,191,0.8)] scale-110 z-20";
                    } else colorClasses = "bg-slate-800 border-slate-700 text-slate-600 opacity-30";
                } else {
                    if (d.locked) colorClasses = "bg-emerald-900 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]";
                    else {
                        if (d.matchedGroups['D']) colorClasses = "bg-teal-900 border-teal-400 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.5)]";
                        else if (d.matchedGroups['C']) colorClasses = "bg-purple-900 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(192,132,252,0.5)]";
                        else if (d.matchedGroups['B']) colorClasses = "bg-pink-900 border-pink-400 text-pink-200 shadow-[0_0_10px_rgba(244,114,182,0.5)]";
                        else if (d.matchedGroups['A']) colorClasses = "bg-blue-900 border-blue-400 text-blue-200 shadow-[0_0_10px_rgba(96,165,250,0.5)]";
                        else colorClasses = "bg-slate-700 border-slate-500 text-white hover:bg-slate-600";
                    }
                }
            } else if (d.locked) colorClasses = "bg-emerald-900 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]";
            else colorClasses = "bg-slate-700 border-slate-500 text-white hover:bg-slate-600";
        }

        let lockIcon = d.locked && !activeHighlight ? `<div class="absolute -top-2.5 -right-2.5 -rotate-45 bg-emerald-500 rounded-full p-0.5 shadow border border-emerald-300 z-20"><svg class="w-4 h-4 text-emerald-950" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" fill-rule="evenodd"></path></svg></div>` : '';
        let valDisplay = (battle.state === 'IDLE') ? '-' : (battle.state === 'ROLLING' && !d.locked ? '?' : d.val);
        let cursor = battle.state === 'WAIT_ACTION' && !activeHighlight ? 'cursor-pointer dice-btn' : '';

        return `
        <div class="${wrapperClass}">
            <div id="dice-element-${idx}" onclick="window.toggleLock(${idx})" class="${diamondClass} ${colorClasses} ${cursor}">
                <div class="${innerClass}">${valDisplay}</div>
                ${lockIcon}
            </div>
        </div>`;
    }).join('');

    el.rollsBadge.innerText = `剩餘重骰：${battle.rollsLeft}`;
    el.rollsBadge.className = battle.rollsLeft === 0 ? "bg-slate-700 px-3 py-1 rounded-full text-xs md:text-sm font-bold text-slate-400 transition-colors" : "bg-slate-700 px-3 py-1 rounded-full text-xs md:text-sm font-bold text-amber-300 transition-colors";
}

export function renderControls(battle) {
    if (battle.state === 'IDLE') { el.controlsContainer.innerHTML = ''; return; }
    let isRolling = battle.state === 'ROLLING', isAttacking = battle.state === 'ATTACKING';
    let rollDisabled = (battle.rollsLeft <= 0 || isRolling || isAttacking) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-blue-500 active:scale-95";
    let scoreDisabled = (isRolling || isAttacking) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-red-500 active:scale-95 shadow-lg shadow-red-900/50";

    el.controlsContainer.innerHTML = `
    <button onclick="window.executeRoll(false)" ${rollDisabled} class="w-full flex-1 bg-blue-600 text-white font-black rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">
        <span class="text-base md:text-lg leading-tight">重骰</span>
        <span class="text-[10px] md:text-xs opacity-80 mt-0.5">(-1 次)</span>
    </button>
    <button onclick="window.fireAttack()" ${scoreDisabled} class="w-full flex-[1.5] bg-red-600 text-white font-black rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-red-800 active:border-b-0 active:translate-y-1">
        <span class="text-xl md:text-2xl mb-0.5">🗡️</span>
        <span class="text-sm md:text-base leading-tight">攻擊</span>
    </button>
    `;
}

// --- ★ 任務1 & 4：增加顯眼牌型字體與倍率 ---
export function renderScore(battle, activeHighlight) {
    if (!battle.scoreResult || battle.state === 'ROLLING') {
        el.scoreDisplay.innerHTML = `<div class="text-slate-500 text-center mt-6 mb-6 font-bold animate-pulse text-lg">盤面結算中...</div>`;
        if (el.finalScoreValue) el.finalScoreValue.innerText = '0';
        return;
    }
    let res = battle.scoreResult;
    // 總乘區的 Note 也加大了
    let notesHtml = res.globalNotes.map(n => `<div class="text-xs md:text-sm text-amber-400 bg-amber-900/30 p-2 rounded-md mb-1.5 border border-amber-900/50 font-bold">${n}</div>`).join('');

    let getBoxStyle = (group, tag) => {
        if(tag.name === '無') return 'text-slate-500 border-slate-700/50 opacity-50';
        let base = '';
        if(group === 'A') base = 'text-blue-300 border-blue-900/50 bg-blue-900/20 hover:border-blue-400 cursor-pointer transition-all active:scale-95';
        if(group === 'B') base = 'text-pink-300 border-pink-900/50 bg-pink-900/20 hover:border-pink-400 cursor-pointer transition-all active:scale-95';
        if(group === 'C') base = 'text-purple-300 border-purple-900/50 bg-purple-900/20 hover:border-purple-400 cursor-pointer transition-all active:scale-95';
        if(group === 'D') base = 'text-teal-300 border-teal-900/50 bg-teal-900/20 hover:border-teal-400 cursor-pointer transition-all active:scale-95';

        if(activeHighlight === group) base += ' ring-2 ring-white scale-105 shadow-lg z-10';
        else if(activeHighlight && activeHighlight !== group) base += ' opacity-30 grayscale';
        return base;
    };

    el.scoreDisplay.innerHTML = `
    <div class="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700 mb-3 shadow-inner">
        <span class="text-sm md:text-base font-bold text-slate-400">底盤點數</span>
        <span class="text-xl md:text-2xl font-black text-white">${res.totalBase.toFixed(1)}</span>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-3">
        <div onclick="window.setHighlight('A')" class="flex flex-col p-3 rounded-xl border ${getBoxStyle('A', res.tagA)}">
            <div class="text-sm md:text-base font-bold truncate opacity-90">A: ${res.tagA.name}</div>
            <div class="font-black text-right text-2xl md:text-3xl mt-1">x${res.tagA.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('B')" class="flex flex-col p-3 rounded-xl border ${getBoxStyle('B', res.tagB)}">
            <div class="text-sm md:text-base font-bold truncate opacity-90">B: ${res.tagB.name}</div>
            <div class="font-black text-right text-2xl md:text-3xl mt-1">x${res.tagB.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('C')" class="flex flex-col p-3 rounded-xl border ${getBoxStyle('C', res.tagC)}">
            <div class="text-sm md:text-base font-bold truncate opacity-90">C: ${res.tagC.name}</div>
            <div class="font-black text-right text-2xl md:text-3xl mt-1">x${res.tagC.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('D')" class="flex flex-col p-3 rounded-xl border ${getBoxStyle('D', res.tagD)}">
            <div class="text-sm md:text-base font-bold truncate opacity-90">D: ${res.tagD.name}</div>
            <div class="font-black text-right text-2xl md:text-3xl mt-1">x${res.tagD.multi.toFixed(1)}</div>
        </div>
    </div>
    <div class="mb-2">${notesHtml}</div>
    `;

    // ★ 任務2：將數字更新到新的顯眼位置 ★
    if (el.finalScoreValue) {
        el.finalScoreValue.innerText = Math.floor(res.finalScore).toLocaleString();
        // 如果有發動絕對秩序等高倍率，可以加上簡單的顏色反饋
        if(res.finalMultiplier > 50) {
            el.finalScoreValue.classList.add('text-amber-300');
            el.finalScoreValue.classList.remove('text-white');
        } else {
            el.finalScoreValue.classList.add('text-white');
            el.finalScoreValue.classList.remove('text-amber-300');
        }
    }
}

// 商店渲染邏輯 (字加大)
export function renderShopItems(shopItems, player) {
    el.shopItemsContainer.innerHTML = shopItems.map((r, idx) => {
        let canAfford = player.gold >= r.price;
        let btnClass = canAfford ? "bg-yellow-600 hover:bg-yellow-500 text-white active:scale-95 shadow-md border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1" : "bg-slate-700 text-slate-500 cursor-not-allowed";
        let style = RARITY[r.rarity];

        return `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-20 h-20 ${style.bg} blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg md:text-xl font-black ${style.color}">${r.name}</h3>
                    <span class="text-[10px] md:text-xs px-2 py-1 rounded ${style.bg} ${style.color} border ${style.border} font-bold">${style.label}</span>
                </div>
                <p class="text-sm text-slate-300 mb-4 h-12 font-bold">${r.desc}</p>
            </div>
            <button onclick="window.buyItem(${idx})" class="w-full font-black py-3 rounded-xl transition-all relative z-10 text-base md:text-lg ${btnClass}" ${!canAfford ? 'disabled' : ''}>
                💰 ${r.price} 金幣
            </button>
        </div>`;
    }).join('');
    
    if(shopItems.length === 0) el.shopItemsContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 font-bold text-lg">商店已經被你買空了！</div>`;
}

export function updateShopRerollBtn(shopRerollsUsed) {
    if (shopRerollsUsed === 0) {
        el.shopRerollBtn.innerHTML = "🆓 免費刷新";
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-colors active:scale-95 text-lg md:text-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-900/50";
    } else {
        el.shopRerollBtn.innerHTML = "🔄 刷新商店 (3 金幣)";
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-xl transition-colors active:scale-95 text-lg md:text-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1";
    }
}