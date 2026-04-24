// js/ui.js
import { RARITY, RELIC_DB, ENEMY_DB, RULE_DB, SHACKLE_DB, getEnemy, FUSION_RECIPES } from './data.js';

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
    finalScoreValue: document.getElementById('final-score-value'),
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
    btnNewGame: document.getElementById('btn-new-game'),
    btnHistory: document.getElementById('btn-history'),
    historyModal: document.getElementById('history-modal'),
    historyContent: document.getElementById('history-content'),
    btnCloseHistory: document.getElementById('btn-close-history'),
    endStats: document.getElementById('end-stats'),
    btnCollection: document.getElementById('btn-collection'),
    collectionModal: document.getElementById('collection-modal'),
    btnCloseCollection: document.getElementById('btn-close-collection'),
    collectionContent: document.getElementById('collection-content'),
    tabHands: document.getElementById('tab-hands'),
    tabRelics: document.getElementById('tab-relics'),
    tabShackles: document.getElementById('tab-shackles'),
    btnSouls: document.getElementById('btn-souls'),
    soulsModal: document.getElementById('souls-modal'),
    btnCloseSouls: document.getElementById('btn-close-souls'),
    soulsContent: document.getElementById('souls-content'),
    soulsHeaderText: document.getElementById('souls-header-text')
};

if (document.getElementById('btn-rules')) {
    document.getElementById('btn-rules').innerHTML = "📖 牌型表";
    document.getElementById('btn-rules').className = "bg-amber-600 hover:bg-amber-500 text-white text-xs md:text-sm font-black py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(217,119,6,0.6)] active:scale-95 flex items-center border border-amber-400";
}

// --- 動畫與特效 ---
export function shootConfetti() {
    if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f87171', '#60a5fa', '#34d399'] });
}

// ★ 更新：讓 Toast 提示更顯眼，支援多行文字
let activeToasts = [];

export function showToast(msg, callback) {
    let toast = document.createElement('div');
    toast.className = 'fixed left-1/2 -translate-x-1/2 bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-amber-500 z-[100] text-lg md:text-2xl text-center flex flex-col gap-2 toast-enter whitespace-pre-wrap leading-relaxed transition-all duration-300';

    if (msg instanceof Node) {
        toast.appendChild(msg);
    } else {
        toast.textContent = msg;
    }

    document.body.appendChild(toast);
    activeToasts.push(toast);

    // Reposition all active toasts
    const spacing = 10;
    let currentY = window.innerHeight / 2 - 50; // Start roughly at middle
    
    // We position them relative to top or bottom? Let's just stack them downwards from middle
    for (let i = activeToasts.length - 1; i >= 0; i--) {
        let t = activeToasts[i];
        t.style.top = currentY + 'px';
        currentY += t.offsetHeight + spacing;
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { 
            toast.remove(); 
            activeToasts = activeToasts.filter(t => t !== toast);
            if(callback) callback(); 
        }, 300);
    }, 1500);
}

// --- 動態生成牌型表 ---
export function renderRulesDB() {
    let html = '';
    const groups = [
        { key: 'groupA', title: '【A區】同數頻率' },
        { key: 'groupB', title: '【B區】順子連號' },
        { key: 'groupC', title: '【C區】複合牌型' },
        { key: 'groupD', title: '【D區】極端盤面' }
    ];
    
    groups.forEach(g => {
        html += `<h3 class="text-base md:text-lg font-black text-slate-300 mt-4 mb-2 border-b border-slate-700 pb-1">${g.title}</h3>`;
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">`;
        RULE_DB[g.key].forEach(rule => {
            let rStyle = RARITY[rule.rarity] || RARITY[1];
            html += `
            <div class="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700">
                <div>
                    <div class="flex items-center gap-2">
                        <div class="text-sm md:text-base font-bold text-slate-200">${rule.name}</div>
                        ${rule.rarity ? `<span class="text-[9px] md:text-[10px] px-1 py-0.5 rounded ${rStyle.bg} ${rStyle.color} border ${rStyle.border}">${rStyle.label}</span>` : ''}
                    </div>
                    <div class="text-[10px] md:text-sm text-slate-400">${rule.desc}</div>
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
    if (stage.level < ENEMY_DB.length) {
        el.stageInfo.innerText = `關卡 ${stage.level + 1} / ${ENEMY_DB.length}`;
    } else {
        let infiniteLevel = stage.level - ENEMY_DB.length + 1;
        let n = Math.floor((infiniteLevel - 1) / 3) + 1;
        let m = ((infiniteLevel - 1) % 3) + 1;
        el.stageInfo.innerText = `無限塔 ${n}-${m}`;
    }
    
    let maxHp = window.getMaxHp ? window.getMaxHp() : 3;
    if (window.getStageActiveShackle && window.getStageActiveShackle() === 'wither') {
        maxHp = 1;
    }
    
    el.playerHp.innerText = `${player.hp}/${maxHp}`;
    el.playerGold.innerText = player.gold;
}

export function updateEnemyUI(stage) {
    let enemy = getEnemy(stage.level);
    
    let shackleHtml = '';
    if (stage.shackles && stage.shackles.length > 0) {
        shackleHtml = stage.shackles.map(sh => `<span onclick="window.showShackleInfo('${sh.id}')" class="ml-2 bg-slate-700/80 hover:bg-slate-600 text-[10px] md:text-xs text-amber-300 px-1.5 py-0.5 rounded cursor-pointer border border-amber-500/50 shadow-sm transition-colors active:scale-95 flex-shrink-0">⛓️ 枷鎖</span>`).join('');
    }
    
    el.enemyName.innerHTML = `⚔️ ${enemy.name}${shackleHtml}`;

    el.enemyName.className = "text-xl font-bold flex-1 flex items-center";
    if (stage.level >= ENEMY_DB.length) {
        el.enemyName.classList.add("text-fuchsia-400");
    } else if (stage.level === 4) {
        el.enemyName.classList.add("text-amber-400");
    } else if (stage.level === 3) {
        el.enemyName.classList.add("text-purple-400");
    } else if (stage.level === 2) {
        el.enemyName.classList.add("text-rose-400");
    } else {
        el.enemyName.classList.add("text-slate-200");
    }
    
    el.turnsLeft.innerText = `剩餘 ${stage.turnsLeft} 次發動攻擊次數`;
    let pct = Math.max(0, (stage.enemyHp / stage.enemyMaxHp) * 100);
    el.enemyHpBar.style.width = `${pct}%`;
    el.enemyHpText.innerText = `${Math.floor(stage.enemyHp).toLocaleString()} / ${stage.enemyMaxHp.toLocaleString()}`;
}

window.showShackleInfo = function(id) {
    let s = SHACKLE_DB.find(x => x.id === id);
    if(s) {
        let container = document.createElement('div');
        let nameSpan = document.createElement('span');
        nameSpan.className = s.type === 'heavy' ? "text-red-400 font-black" : "text-amber-400 font-black";
        nameSpan.textContent = s.name;

        let descSpan = document.createElement('span');
        descSpan.className = "text-sm md:text-lg text-slate-200 mt-2 block";
        descSpan.textContent = s.desc;

        container.appendChild(nameSpan);
        container.appendChild(descSpan);

        showToast(container);
    }
};

// --- ★ 任務4：遺物點擊顯示說明 ---
export function renderInventory(player, battle) {
    el.inventoryGrid.className = "flex flex-wrap gap-1.5";
    if (player.relics.length === 0) {
        el.inventoryGrid.innerHTML = `<div class="text-[10px] text-slate-500 font-bold p-1">背包空空如也</div>`;
        return;
    }
    let sortedRelics = [...player.relics].sort((a,b) => RELIC_DB.find(x=>x.id===b).rarity - RELIC_DB.find(x=>x.id===a).rarity);
    
    let isNoise = window.getStageActiveShackle && window.getStageActiveShackle() === 'noise';

    el.inventoryGrid.innerHTML = sortedRelics.map(id => {
        if (isNoise) {
            return `
            <div onclick="window.showToast('🔇 【噪音】干擾，無法查看遺物效果！')" class="bg-slate-700/50 px-2 py-1 rounded-full border border-slate-500 shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform active:scale-95">
                <span class="text-[10px] md:text-xs font-black text-slate-400 whitespace-nowrap">????</span>
            </div>`;
        }

        let r = RELIC_DB.find(x => x.id === id);
        let style = RARITY[r.rarity];
        let isFusionMaterial = false;
        if (player && player.relics) {
            for (let fid in FUSION_RECIPES) {
                let rec = FUSION_RECIPES[fid];
                if ((rec.mat1 === r.id && player.relics.includes(rec.mat2)) ||
                    (rec.mat2 === r.id && player.relics.includes(rec.mat1))) {
                    isFusionMaterial = true;
                    break;
                }
            }
        }
        return `
        <div onclick="window.showRelicInfo('${r.id}')" class="${style.bg} px-2 py-1 rounded-full border ${style.border} shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform active:scale-95">
            <span class="text-[10px] md:text-xs font-black ${style.color} whitespace-nowrap">${r.name}</span>
        </div>`;
    }).join('');
}

// 註冊給 inventory 點擊用的全域函式
window.showRelicInfo = function(id) {
    let r = RELIC_DB.find(x => x.id === id);
    if(r) {
        let container = document.createElement('div');
        let nameSpan = document.createElement('span');
        nameSpan.className = "text-amber-400 font-black";
        nameSpan.textContent = r.name;

        let descSpan = document.createElement('span');
        descSpan.className = "text-sm md:text-lg text-slate-200 mt-2 block";
        descSpan.textContent = r.desc;

        container.appendChild(nameSpan);
        container.appendChild(descSpan);

        showToast(container);
    }
};

// --- 巨型八邊形骰子渲染 ---
export function renderDice(battle, activeHighlight, player) {
    let shackleId = window.getStageActiveShackle ? window.getStageActiveShackle() : null;
    let shackleMeta = window.getShackleMeta ? window.getShackleMeta() : null;

    el.diceContainer.innerHTML = battle.dice.map((d, idx) => {
        let wrapperClass = "w-11 h-11 md:w-16 md:h-16 relative mx-auto my-0.5 cursor-pointer dice-btn transition-transform duration-200";
        
        let outerColor = "bg-slate-500";
        let innerColor = "bg-slate-700";
        let innerHover = "hover:bg-slate-600";
        let textColor = "text-white";
        let extraClass = "";
        let displayOrderStyle = "";

        // UI Hook: dizziness - random visual grid order
        if (shackleId === 'dizziness' && shackleMeta && shackleMeta.displayOrder) {
            displayOrderStyle = `style="order: ${shackleMeta.displayOrder[idx]};"`;
        }

        if(battle.state !== 'IDLE'){
            if (battle.state === 'ROLLING' && !d.locked) {
                innerColor = "bg-slate-800"; outerColor = "bg-slate-600"; textColor = "text-slate-500"; extraClass = "animate-pulse"; innerHover = "";
            } else if (battle.state === 'WAIT_ACTION') {
                if (activeHighlight) {
                    if (d.matchedGroups[activeHighlight]) {
                        if (activeHighlight === 'A') { innerColor = "bg-blue-600"; outerColor = "bg-blue-300"; extraClass = "scale-110 z-20 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"; }
                        else if (activeHighlight === 'B') { innerColor = "bg-pink-600"; outerColor = "bg-pink-300"; extraClass = "scale-110 z-20 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]"; }
                        else if (activeHighlight === 'C') { innerColor = "bg-purple-600"; outerColor = "bg-purple-300"; extraClass = "scale-110 z-20 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]"; }
                        else if (activeHighlight === 'D') { innerColor = "bg-teal-600"; outerColor = "bg-teal-300"; extraClass = "scale-110 z-20 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]"; }
                        innerHover = "";
                    } else {
                        innerColor = "bg-slate-800"; outerColor = "bg-slate-700"; textColor = "text-slate-600"; extraClass = "opacity-30"; innerHover = "";
                    }
                } else {
                    if (d.locked) {
                        innerColor = "bg-emerald-900"; outerColor = "bg-emerald-400"; textColor = "text-emerald-300"; extraClass = "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"; innerHover = "";
                    } else {
                        if (d.matchedGroups['D']) { innerColor = "bg-amber-900"; outerColor = "bg-yellow-400"; textColor = "text-yellow-200"; extraClass = "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"; }
                        else if (d.matchedGroups['C']) { innerColor = "bg-purple-900"; outerColor = "bg-purple-400"; textColor = "text-purple-200"; extraClass = "drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"; }
                        else if (d.matchedGroups['B']) { innerColor = "bg-green-900"; outerColor = "bg-green-400"; textColor = "text-green-200"; extraClass = "drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]"; }
                        else if (d.matchedGroups['A']) { innerColor = "bg-blue-900"; outerColor = "bg-blue-400"; textColor = "text-blue-200"; extraClass = "drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]"; }
                    }
                }
            } else if (d.locked) {
                innerColor = "bg-emerald-900"; outerColor = "bg-emerald-400"; textColor = "text-emerald-300"; extraClass = "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"; innerHover = "";
            }
        }

        // UI Hook: inversion - color mapping corruption
        if (shackleId === 'inversion' && shackleMeta && shackleMeta.colorMap && battle.state !== 'IDLE' && battle.state !== 'ROLLING') {
            innerColor = shackleMeta.colorMap[idx % 8];
            outerColor = shackleMeta.colorMap[(idx + 3) % 8];
            textColor = "text-slate-900";
        }

        let octagonClip = "[clip-path:polygon(29%_0%,71%_0%,100%_29%,100%_71%,71%_100%,29%_100%,0%_71%,0%_29%)]";
        
        let valDisplay = d.val;
        
        let baseVal = d.val;
        let isEnhanced = false;
        if (player && player.relics) {
            let val = d.val;
            let E = (window.getStageLevel ? window.getStageLevel() : 0) + 1;

            if (val === 1 || val === 2) {
                if (player.relics.includes('fusion_source')) { baseVal = 15 + (E * 2.5); isEnhanced = true; }
            }
            if (val === 7 || val === 8) {
                if (player.relics.includes('fusion_peak')) { baseVal = val + Math.floor(player.gold / 20) * 5; isEnhanced = true; }
                if (player.relics.includes('fusion_titan')) { baseVal = baseVal + (E * 3); isEnhanced = true; }
            }
            if (val === 6 && player.relics.includes('fusion_titan')) { baseVal = baseVal + (E * 3); isEnhanced = true; }
            if (val === 2 && player.relics.includes('fusion_bloody')) {
                let lostHp = 3 - player.hp;
                baseVal = 30 + (lostHp > 0 ? lostHp * 10 : 0); isEnhanced = true;
            }

            if (!isEnhanced && player.relics.includes('b' + val)) {
                if (val===1) baseVal=10; else if(val===2) baseVal=10; else if(val===3) baseVal=11; else if(val===4) baseVal=11; else if(val===5) baseVal=11; else if(val===6) baseVal=11; else if(val===7) baseVal=12; else if(val===8) baseVal=12;
                isEnhanced = true;
            }
            if (player.relics.includes('fusion_bloody')) {
                let lostHp = 3 - player.hp;
                if (lostHp > 0 && val !== 2) { baseVal += lostHp * 10; isEnhanced = true; }
            }
        }

        let baseBadgeHtml = '';
        if (battle.state !== 'IDLE' && battle.state !== 'ROLLING') {
             let badgeClass = isEnhanced ? "bg-amber-500 text-amber-950 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-slate-700 text-slate-300 border border-slate-500";
             baseBadgeHtml = `<div class="absolute -top-2 -left-2 ${badgeClass} text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-full z-20">${Math.floor(baseVal)}</div>`;
        }


        // UI Hook: illusion - fake numbers
        if (shackleId === 'illusion' && !d.locked && battle.state !== 'IDLE' && battle.state !== 'ROLLING') {
            valDisplay = shackleMeta && shackleMeta.fakeNumber ? shackleMeta.fakeNumber : 8;
        }

        // UI Hook: blind - mask specific indices
        if (shackleId === 'blind' && battle.state === 'WAIT_ACTION' && shackleMeta && shackleMeta.blindIndices && shackleMeta.blindIndices.includes(idx)) {
            valDisplay = '?';
        }

        if (battle.state === 'IDLE') valDisplay = '-';
        if (battle.state === 'ROLLING' && !d.locked) valDisplay = '?';

        let lockIconHtml = '';
        if (d.locked && !activeHighlight) {
            if (shackleId === 'cursedlock' && shackleMeta && d.id === shackleMeta.cursedId) {
                // Cursed lock UI
                lockIconHtml = `<div class="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 shadow border border-red-300 z-20 animate-pulse"><svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-red-950" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" fill-rule="evenodd"></path></svg></div>`;
            } else {
                // Standard lock UI
                lockIconHtml = `<div class="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 shadow border border-emerald-300 z-20"><svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-950" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" fill-rule="evenodd"></path></svg></div>`;
            }
        }

        return `
        <div id="dice-element-${idx}" onclick="window.toggleLock(${idx})" class="${wrapperClass} ${extraClass}" ${displayOrderStyle}>
            <div class="absolute inset-0 ${outerColor} ${octagonClip} transition-colors duration-200"></div>
            <div class="absolute inset-[2px] md:inset-[3px] ${innerColor} ${innerHover} ${octagonClip} flex items-center justify-center transition-colors duration-200">
                <span class="text-2xl md:text-4xl font-black ${textColor}">${valDisplay}</span>
            </div>
            ${lockIconHtml}
            ${baseBadgeHtml}
        </div>`;
    }).join('');

    el.rollsBadge.innerText = `剩餘重骰：${battle.rollsLeft}`;
    el.rollsBadge.className = battle.rollsLeft === 0 ? "bg-slate-700 px-2 py-0.5 rounded-full text-[10px] md:text-sm font-bold text-slate-400 transition-colors" : "bg-slate-700 px-2 py-0.5 rounded-full text-[10px] md:text-sm font-bold text-amber-300 transition-colors";
}

// --- 控制器渲染 ---
export function renderControls(battle) {
    if (battle.state === 'IDLE') { el.controlsContainer.innerHTML = ''; return; }
    let isRolling = battle.state === 'ROLLING', isAttacking = battle.state === 'ATTACKING';
    let rollDisabled = (battle.rollsLeft <= 0 || isRolling || isAttacking) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-blue-500 active:scale-95";
    let scoreDisabled = (isRolling || isAttacking) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-red-500 active:scale-95 shadow-lg shadow-red-900/50";

    el.controlsContainer.innerHTML = `
    <button onclick="window.executeRoll(false)" ${rollDisabled} class="w-full flex-1 bg-blue-600 text-white font-black rounded-lg md:rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">
        <span class="text-sm md:text-lg leading-tight">重骰</span>
        <span class="text-[8px] md:text-[10px] opacity-90 mt-0.5 font-bold">(可點擊骰子保留)</span>
    </button>
    <button onclick="window.fireAttack()" ${scoreDisabled} class="w-full flex-[1.5] bg-red-600 text-white font-black rounded-lg md:rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-red-800 active:border-b-0 active:translate-y-1">
        <span class="text-lg md:text-2xl mb-0.5">🗡️</span>
        <span class="text-xs md:text-base leading-tight">攻擊</span>
    </button>
    `;
}

// --- 牌型結算渲染 ---
export function renderScore(battle, activeHighlight) {
    if (!battle.scoreResult || battle.state === 'ROLLING') {
        el.scoreDisplay.innerHTML = `<div class="text-slate-500 text-center mt-2 mb-2 font-bold animate-pulse text-xs">盤面結算中...</div>`;
        if (el.finalScoreValue) el.finalScoreValue.innerText = '0';
        return;
    }
    let res = battle.scoreResult;
    let isAmnesia = window.getStageActiveShackle && window.getStageActiveShackle() === 'amnesia';

    let notesHtml = res.globalNotes.map(n => `<span class="text-[9px] text-amber-400 bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-900/50 font-bold whitespace-nowrap">${isAmnesia ? '???' : n}</span>`).join('');

    let getBoxStyle = (group, tag) => {
        if(tag.name === '無') return 'text-slate-500 border-slate-700/50 opacity-40 bg-slate-900/50';
        let base = '';
        if(group === 'A') base = 'text-blue-300 border-blue-900/80 bg-blue-900/30 hover:border-blue-400 cursor-pointer transition-all active:scale-95';
        if(group === 'B') base = 'text-pink-300 border-pink-900/80 bg-pink-900/30 hover:border-pink-400 cursor-pointer transition-all active:scale-95';
        if(group === 'C') base = 'text-purple-300 border-purple-900/80 bg-purple-900/30 hover:border-purple-400 cursor-pointer transition-all active:scale-95';
        if(group === 'D') base = 'text-teal-300 border-teal-900/80 bg-teal-900/30 hover:border-teal-400 cursor-pointer transition-all active:scale-95';

        if(activeHighlight === group) base += ' ring-1 ring-white scale-105 shadow-md z-10';
        else if(activeHighlight && activeHighlight !== group) base += ' opacity-30 grayscale';
        return base;
    };

    el.scoreDisplay.innerHTML = `
    <div class="flex flex-col gap-1.5 bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-700 mb-1.5 shadow-inner">
        <div class="text-[11px] md:text-sm font-bold text-slate-400 whitespace-nowrap">骰子點數加成後總和: <span class="text-sm md:text-base font-black text-white ml-1">${res.totalBase.toFixed(1)}</span></div>
        <div class="flex flex-wrap gap-1">${notesHtml}</div>
    </div>
    
    <div class="grid grid-cols-4 gap-1.5 mb-1">
        <div onclick="window.setHighlight('A')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border ${getBoxStyle('A', res.tagA)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90">${res.tagA.name}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagA.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('B')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border ${getBoxStyle('B', res.tagB)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90">${res.tagB.name}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagB.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('C')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border ${getBoxStyle('C', res.tagC)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90">${res.tagC.name}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagC.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('D')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border ${getBoxStyle('D', res.tagD)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90">${res.tagD.name}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagD.multi.toFixed(1)}</div>
        </div>
    </div>
    `;

    if (el.finalScoreValue) {
        if (window.getStageActiveShackle && window.getStageActiveShackle() === 'bluff') {
            el.finalScoreValue.innerText = '???';
            el.finalScoreValue.classList.add('text-white');
            el.finalScoreValue.classList.remove('text-amber-300');
        } else {
            el.finalScoreValue.innerText = Math.floor(res.finalScore).toLocaleString();
            if(res.finalMultiplier > 50) {
                el.finalScoreValue.classList.add('text-amber-300');
                el.finalScoreValue.classList.remove('text-white');
            } else {
                el.finalScoreValue.classList.add('text-white');
                el.finalScoreValue.classList.remove('text-amber-300');
            }
        }
    }
}

// --- 商店渲染邏輯 ---
export function renderShopItems(shopItems, player) {
    el.shopItemsContainer.innerHTML = shopItems.map((r, idx) => {
        let canAfford = player.gold >= r.price;
        let btnClass = canAfford ? "bg-yellow-600 hover:bg-yellow-500 text-white active:scale-95 shadow-md border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1" : "bg-slate-700 text-slate-500 cursor-not-allowed";
        let style = RARITY[r.rarity];

        return `
        <div class="bg-slate-800 p-3 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-20 h-20 ${style.bg} blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div class="relative z-10">
                <div class="flex flex-col gap-1 mb-2">
                    <div class="flex justify-between items-start">
                        <h3 class="text-base md:text-xl font-black ${style.color}">${r.name}</h3>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} font-bold">${style.label}</span>
                            ${isFusionMaterial ? '<span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500 font-bold shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse">✨ 可融合</span>' : ''}
                        </div>
                    </div>
                </div>
                <p class="text-xs md:text-sm text-slate-300 mb-3 h-10 font-bold">${r.desc}</p>
            </div>
            <button onclick="window.buyItem(${idx})" class="w-full font-black py-2.5 rounded-lg transition-all relative z-10 text-sm md:text-base ${btnClass}" ${!canAfford ? 'disabled' : ''}>
                💰 ${r.price} 金幣
            </button>
        </div>`;
    }).join('');
    
    if(shopItems.length === 0) el.shopItemsContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-6 font-bold text-base">商店已經被你買空了！</div>`;
}

export function updateShopRerollBtn(shopRerollsUsed, hasScavenger = false) {
    let cost = 0;
    if (shopRerollsUsed > 0) {
        cost = 3 + (shopRerollsUsed - 1); // 1st = 0, 2nd = 3, 3rd = 4, 4th = 5...
        if (hasScavenger) {
            cost = Math.max(1, cost - 2); // Scavenger discounts by 2, minimum 1
        }
    }
    
    if (cost === 0) {
        el.shopRerollBtn.innerHTML = "🆓 免費刷新";
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-colors active:scale-95 text-base md:text-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-900/50";
    } else {
        el.shopRerollBtn.innerHTML = `🔄 刷新商店 (${cost} 金幣)`;
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black py-3 rounded-xl transition-colors active:scale-95 text-base md:text-lg border-b-4 border-slate-900 active:border-b-0 active:translate-y-1";
    }
}

export function renderHistoryModal(records) {
    if (!records || records.length === 0) {
        el.historyContent.innerHTML = `<div class="text-center text-slate-500 py-6 font-bold">尚無歷史紀錄。</div>`;
        return;
    }
    
    el.historyContent.innerHTML = records.map((r, i) => {
        let resultColor = r.win ? "text-amber-400" : "text-red-400";
        let resultText = r.stageName || (r.win ? "勝利" : "失敗");
        let dateObj = new Date(r.date);
        let dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let relicHtml = (r.relics && r.relics.length > 0) ? r.relics.map(id => {
            let relicDef = RELIC_DB.find(x => x.id === id);
            if (!relicDef) return '';
            return `<span class="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300 mr-1 mb-1 inline-block">${relicDef.name}</span>`;
        }).join('') : '<span class="text-slate-500 text-[10px]">無</span>';
        
        return `
        <div class="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-1 relative overflow-hidden">
            <div class="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span class="font-black ${resultColor} text-sm md:text-base">${resultText}</span>
                <span class="text-[10px] md:text-xs text-slate-400">${dateStr}</span>
            </div>
            <div class="text-xs md:text-sm text-slate-300">
                <span class="text-slate-500">最高傷害:</span> <span class="font-black text-white">${Number(r.highestDamage).toLocaleString()}</span>
            </div>
            <div class="text-xs md:text-sm text-slate-300">
                <span class="text-slate-500">最佳牌型:</span> <span class="font-bold text-blue-300">${r.combo || '無'}</span>
            </div>
            <div class="mt-1">
                <div class="text-[10px] text-slate-500 mb-0.5">最終持有遺物:</div>
                <div class="flex flex-wrap">${relicHtml}</div>
            </div>
        </div>`;
    }).reverse().join('');
}

export function renderEndGameStats(highestDamage, highestDamageCombo, relics) {
    if(!el.endStats) return;
    
    let relicHtml = (relics && relics.length > 0) ? relics.map(id => {
        let relicDef = RELIC_DB.find(x => x.id === id);
        if (!relicDef) return '';
        let style = RARITY[relicDef.rarity] || RARITY[1];
        return `<span class="${style.bg} ${style.color} px-2 py-1 rounded text-xs border ${style.border} inline-block">${relicDef.name}</span>`;
    }).join(' ') : '<span class="text-slate-500">無</span>';
    
    el.endStats.innerHTML = `
        <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 w-full max-w-sm mx-auto shadow-inner text-left">
            <div class="mb-2 border-b border-slate-700/50 pb-2">
                <div class="text-xs text-slate-400 mb-1">本局最高傷害</div>
                <div class="text-2xl md:text-3xl font-black text-white">${Number(highestDamage).toLocaleString()}</div>
                <div class="text-sm font-bold text-blue-300 mt-1">${highestDamageCombo || '無'}</div>
            </div>
            <div>
                <div class="text-xs text-slate-400 mb-1.5">最終持有遺物</div>
                <div class="flex flex-wrap gap-1">${relicHtml}</div>
            </div>
        </div>
    `;
}

// --- 收集冊渲染 ---
export function renderCollectionModal(tab) {
    const coll = window.getCollection ? window.getCollection() : { hands: [], relics: [], shackles: [] };
    let html = '';

    if (tab === 'hands') {
        const groups = [
            { key: 'groupA', title: '【A區】同數頻率' },
            { key: 'groupB', title: '【B區】順子連號' },
            { key: 'groupC', title: '【C區】複合牌型' },
            { key: 'groupD', title: '【D區】極端盤面' }
        ];
        groups.forEach(g => {
            html += `<h3 class="text-base md:text-lg font-black text-slate-300 mt-2 mb-1 border-b border-slate-700 pb-1">${g.title}</h3>`;
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">`;
            RULE_DB[g.key].forEach(rule => {
                const unlocked = coll.hands.includes(rule.name);
                const nameStr = unlocked ? `${rule.name} <span class="text-emerald-400 text-xs ml-1">✅</span>` : `???`;
                const descStr = unlocked ? rule.desc : '未解鎖';
                const opacity = unlocked ? 'opacity-100' : 'opacity-50 grayscale';
                let rStyle = RARITY[rule.rarity] || RARITY[1];
                let rarityHtml = (unlocked && rule.rarity) ? `<span class="text-[9px] md:text-[10px] px-1 py-0.5 rounded ${rStyle.bg} ${rStyle.color} border ${rStyle.border}">${rStyle.label}</span>` : '';
                html += `
                <div class="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700 ${opacity}">
                    <div>
                        <div class="flex items-center gap-2">
                            <div class="text-sm md:text-base font-bold text-slate-200">${nameStr}</div>
                            ${rarityHtml}
                        </div>
                        <div class="text-[10px] md:text-sm text-slate-400">${descStr}</div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        });
    } else if (tab === 'relics') {
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">`;
        RELIC_DB.forEach(r => {
            const unlocked = coll.relics.includes(r.id);
            if (unlocked) {
                let style = RARITY[r.rarity] || RARITY[1];
                html += `
                <div class="bg-slate-800 p-2 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black ${style.color}">${r.name} <span class="text-emerald-400 text-xs ml-1">✅</span></h3>
                        <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} font-bold">${style.label}</span>
                    </div>
                    <p class="text-xs md:text-sm text-slate-300 font-bold">${r.desc}</p>
                </div>`;
            } else {
                html += `
                <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col justify-between relative overflow-hidden opacity-50">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black text-slate-500">???</h3>
                    </div>
                    <p class="text-xs md:text-sm text-slate-600 font-bold">未解鎖遺物</p>
                </div>`;
            }
        });
        html += `</div>`;
    } else if (tab === 'shackles') {
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">`;
        SHACKLE_DB.forEach(s => {
            const unlocked = coll.shackles.includes(s.id);
            if (unlocked) {
                let colorClass = s.type === 'heavy' ? "text-red-400" : "text-amber-400";
                let typeLabel = s.type === 'heavy' ? "重度" : "輕度";
                html += `
                <div class="bg-slate-800 p-2 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black ${colorClass}">${s.name} <span class="text-emerald-400 text-xs ml-1">✅</span></h3>
                        <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-500 font-bold">${typeLabel}</span>
                    </div>
                    <p class="text-xs md:text-sm text-slate-300 font-bold">${s.desc}</p>
                </div>`;
            } else {
                html += `
                <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col justify-between relative overflow-hidden opacity-50">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black text-slate-500">???</h3>
                    </div>
                    <p class="text-xs md:text-sm text-slate-600 font-bold">未解鎖枷鎖</p>
                </div>`;
            }
        });
        html += `</div>`;
    }
    
    el.collectionContent.innerHTML = html;
}


export function renderSoulsModal(metaData) {
    if (!el.soulsContent) return;
    el.soulsHeaderText.innerText = `目前持有靈魂：${metaData.souls} 👻`;

    const upgDefs = [
        { id: 'hp', name: '❤️ 體魄鍛鍊', desc: '最大 HP +1', max: 2, cost: 10 },
        { id: 'discount', name: '🏷️ 商店折扣', desc: '商店遺物價格 -2 金幣', max: 3, cost: 5 },
        { id: 'startGold', name: '💰 初始資金', desc: '初始金幣 +10', max: 3, cost: 5 },
        { id: 'rerolls', name: '🎲 骰子掌握', desc: '初始重骰次數 +1', max: 2, cost: 15 },
        { id: 'startRelic', name: '🎁 初始裝備', desc: '開局隨機獲得 1 個普通遺物', max: 1, cost: 30 },
        { id: 'finalDamage', name: '⚔️ 力量覺醒', desc: '最終傷害 +10%', max: 5, cost: 20 }
    ];

    el.soulsContent.innerHTML = upgDefs.map(u => {
        let currentLv = metaData.upgrades[u.id] || 0;
        let isMax = currentLv >= u.max;
        let canAfford = metaData.souls >= u.cost;

        let dots = Array(u.max).fill().map((_, i) => i < currentLv ? '🟢' : '⚫').join(' ');
        let btnHtml = isMax
            ? `<button disabled class="bg-slate-700 text-slate-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">已滿級</button>`
            : `<button onclick="window.buySoulUpgrade('${u.id}', ${u.cost})" class="${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} font-black py-2 px-4 rounded-lg transition-transform active:scale-95" ${canAfford ? '' : 'disabled'}>花費 ${u.cost} 👻</button>`;

        return `
        <div class="bg-slate-900/50 border border-indigo-900/50 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <div class="text-base font-black text-indigo-300">${u.name}</div>
                <div class="text-xs text-slate-400 mt-0.5">${u.desc}</div>
                <div class="text-xs mt-1">${dots} (${currentLv}/${u.max})</div>
            </div>
            <div class="w-full sm:w-auto text-right">
                ${btnHtml}
            </div>
        </div>
        `;
    }).join('');
}

window.buySoulUpgrade = function(id, cost) {
    let meta = window.getMetaData();
    if (meta.souls >= cost) {
        meta.souls -= cost;
        meta.upgrades[id] = (meta.upgrades[id] || 0) + 1;
        window.saveMetaData();
        renderSoulsModal(meta);
    }
};
