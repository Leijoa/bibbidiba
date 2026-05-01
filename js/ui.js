// js/ui.js
import { RARITY, RELIC_DB, ENEMY_DB, RULE_DB, SHACKLE_DB, getEnemy, FUSION_RECIPES } from './data.js';
import { i18n } from './i18n.js';
window.i18n = i18n;

const SOULS_UPG_DEFS = [
    { id: 'hp', name: '❤️ 體魄鍛鍊', desc: '最大 HP +1', max: 2, cost: (lv) => 10 },
    { id: 'rerolls', name: '🎲 骰子掌握', desc: '初始重骰次數 +1', max: 2, cost: (lv) => 15 },
    { id: 'startRelic', name: '🎁 初始裝備', desc: '開局隨機獲得 1 個普通遺物', max: 1, cost: (lv) => 30 },
    { id: 'finalDamage', name: '⚔️ 力量覺醒', desc: '最終傷害 +10%', max: 5, cost: (lv) => 20 },
    { id: 'soulBurst', name: '🔥 靈魂爆發', desc: '敵人血量x(等級+1), 靈魂獲得量+(等級), 在2,5,8,10級時神話遺物上限+1', max: 10, cost: (lv) => 100 + (lv || 0) * 100 }
];


// 緩存 DOM 元素
export const el = {
    stageInfo: document.getElementById('stage-info'),
    playerHp: document.getElementById('player-hp'),
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
    soulsHeaderText: document.getElementById('souls-header-text'),
    devModal: document.getElementById('dev-modal'),
    devRelicSelect: document.getElementById('dev-relic-select'),
    devRelicCancel: document.getElementById('dev-relic-cancel'),
    devRelicConfirm: document.getElementById('dev-relic-confirm'),
    fusionReplaceModal: document.getElementById('fusion-replace-modal'),
    fusionReplaceContent: document.getElementById('fusion-replace-content')
};

if (document.getElementById('btn-rules')) {
    document.getElementById('btn-rules').innerHTML = i18n.t('ui.btn_rules') || "📖 牌型表";
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
    }, 2200);
}

// --- 動態生成牌型表 ---
export function renderRulesDB() {
    let html = '';
    const groups = [
        { key: 'groupA', titleKey: 'rules.groupA_desc' },
        { key: 'groupB', titleKey: 'rules.groupB_desc' },
        { key: 'groupC', titleKey: 'rules.groupC_desc' },
        { key: 'groupD', titleKey: 'rules.groupD_desc' }
    ];
    
    groups.forEach(g => {
        html += `<h3 class="text-base md:text-lg font-black text-slate-300 mt-4 mb-2 border-b border-slate-700 pb-1">${i18n.t(g.titleKey)}</h3>`;
        html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">`;
        RULE_DB[g.key].forEach((rule, rIdx) => {
            let rStyle = RARITY[rule.rarity] || RARITY[1];
            let letter = g.key.replace('group', '').toLowerCase();
            let ruleName = i18n.t(`rules.rule_${letter}${rIdx}.name`) || rule.name;
            let ruleDesc = i18n.t(`rules.rule_${letter}${rIdx}.desc`) || rule.desc;

            html += `
            <div class="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700">
                <div>
                    <div class="flex items-center gap-2">
                        <div class="text-sm md:text-base font-bold ${rStyle.color}">${ruleName}</div>
                    </div>
                    <div class="text-[10px] md:text-sm text-slate-400">${ruleDesc}</div>
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
        el.stageInfo.innerText = i18n.t('ui.stage', `${stage.level + 1} / ${ENEMY_DB.length}`);
        el.stageInfo.setAttribute('data-i18n-args', `${stage.level + 1} / ${ENEMY_DB.length}`);
    } else {
        let infiniteLevel = stage.level - ENEMY_DB.length + 1;
        let n = Math.floor((infiniteLevel - 1) / 3) + 1;
        let m = ((infiniteLevel - 1) % 3) + 1;
        el.stageInfo.innerText = i18n.t('ui.stage', `∞ ${n}-${m}`);
        el.stageInfo.setAttribute('data-i18n-args', `∞ ${n}-${m}`); // Will be migrated later
    }
    
    let maxHp = window.getMaxHp ? window.getMaxHp() : 3;
    if (window.getStageActiveShackle && window.getStageActiveShackle() === 'wither') {
        maxHp = 1;
    }
    
    el.playerHp.innerText = `${player.hp}/${maxHp}`;

    let recycleStatus = document.getElementById('recycle-status');
    if (recycleStatus) {
        recycleStatus.classList.add('hidden');
    }
}

export function updateEnemyUI(stage) {
    let enemy = window.getEnemyWithMeta ? window.getEnemyWithMeta(stage.level) : getEnemy(stage.level);
    
    let shackleHtml = '';
    // legacy support if stage.shackles array exists
    if (stage.shackles && stage.shackles.length > 0) {
        shackleHtml += stage.shackles.map(sh => `<span onclick="window.showShackleInfo('${sh.id}')" class="ml-2 bg-red-900/80 hover:bg-red-800 text-[10px] md:text-xs text-red-300 px-1.5 py-0.5 rounded cursor-pointer border border-red-500/50 shadow-sm transition-colors active:scale-95 flex-shrink-0">⛓️ 當前枷鎖</span>`).join('');
    }

    // new logic using activeShackle
    if (window.getStageActiveShackle && window.getStageActiveShackle()) {
        shackleHtml += `<span onclick="window.showShackleInfo('${window.getStageActiveShackle()}')" class="ml-2 bg-red-900/80 hover:bg-red-800 text-[10px] md:text-xs text-red-300 px-1.5 py-0.5 rounded cursor-pointer border border-red-500/50 shadow-sm transition-colors active:scale-95 flex-shrink-0">⛓️ ${i18n.t('ui.tab_shackles') || '當前枷鎖'}</span>`;
    }

    let localizedEnemyName = enemy.name;
    if (stage.level < ENEMY_DB.length) {
        localizedEnemyName = i18n.t(`enemies.enemy_${stage.level}`) || enemy.name;
    } else {
        localizedEnemyName = enemy.name.replace('虛空幻影', i18n.t('infinite_enemy_prefix') || '虛空幻影');
    }
    
    el.enemyName.innerHTML = `⚔️ ${localizedEnemyName}${shackleHtml}`;

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
    
    el.turnsLeft.innerText = i18n.t('ui.turns_left', stage.turnsLeft);
    let pct = Math.max(0, (stage.enemyHp / stage.enemyMaxHp) * 100);
    el.enemyHpBar.style.width = `${pct}%`;
    el.enemyHpText.innerText = `${Math.floor(stage.enemyHp).toLocaleString()} / ${stage.enemyMaxHp.toLocaleString()}`;
}

window.showShackleInfo = function(id) {
    let s = SHACKLE_DB.find(x => x.id === id);
    if(s) {
        // 使用 i18n 翻譯，若語系檔找不到則退回原本的中文 s.name / s.desc
        let sName = i18n.t(`shackles.${s.id}.name`) || s.name;
        let sDesc = i18n.t(`shackles.${s.id}.desc`) || s.desc;

        let container = document.createElement('div');
        let nameSpan = document.createElement('span');
        nameSpan.className = s.type === 'heavy' ? "text-red-400 font-black" : "text-amber-400 font-black";
        nameSpan.textContent = sName; // 使用翻譯後的名稱

        let descSpan = document.createElement('span');
        descSpan.className = "text-sm md:text-lg text-slate-200 mt-2 block";
        descSpan.textContent = sDesc; // 使用翻譯後的描述

        container.appendChild(nameSpan);
        container.appendChild(descSpan);

        showToast(container);
    }
};

// --- ★ 任務4：遺物點擊顯示說明 ---
export function renderInventory(player, battle) {
    el.inventoryGrid.className = "flex overflow-x-auto gap-1.5 pb-2 scroll-smooth items-center hide-scrollbar";
    if (player.relics.length === 0) {
        el.inventoryGrid.innerHTML = `<div class="text-[10px] text-slate-500 font-bold p-1">${i18n.t("ui.empty_inventory")}</div>`;
        return;
    }
    let sortedRelics = [...player.relics].sort((a,b) => RELIC_DB.find(x=>x.id===b).rarity - RELIC_DB.find(x=>x.id===a).rarity);
    
    let isNoise = window.getStageActiveShackle && window.getStageActiveShackle() === 'noise';

    el.inventoryGrid.innerHTML = sortedRelics.map(id => {
        if (isNoise) {
            return `
            <div onclick="window.showToast(i18n.t('messages.toast_noise_interfere'))" class="bg-slate-700/50 px-2 py-1 rounded-full border border-slate-500 shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform active:scale-95">
                <span class="text-[10px] md:text-xs font-black text-slate-400 whitespace-nowrap">????</span>
            </div>`;
        }

        let r = RELIC_DB.find(x => x.id === id);
        let style = RARITY[r.rarity];
        let isFusionMaterial = false;
        let fusionResultId = null;
        if (player && player.relics) {
            for (let fid in FUSION_RECIPES) {
                let rec = FUSION_RECIPES[fid];
                if ((rec.mat1 === r.id && player.relics.includes(rec.mat2)) ||
                    (rec.mat2 === r.id && player.relics.includes(rec.mat1))) {
                    isFusionMaterial = true;
                    fusionResultId = fid;
                    break;
                }
            }
        }
        let rName = id.startsWith('cons_') ? i18n.t(`consumables.${id}.name`) : (i18n.t(`relics.${id}.name`) || r.name);
        return `
        <div onclick="window.showRelicInfo('${r.id}')" class="${style.bg} px-2 py-1 rounded-full border ${style.border} shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform active:scale-95">
            <span class="text-[10px] md:text-xs font-black ${style.color} whitespace-nowrap">${rName}</span>
        </div>`;
    }).join('');
}

// 註冊給 inventory 點擊用的全域函式
window.showRelicInfo = function(id) {
    let r = RELIC_DB.find(x => x.id === id);
    if(r) {
        let rName = id.startsWith('cons_') ? i18n.t(`consumables.${id}.name`) : (i18n.t(`relics.${id}.name`) || r.name);
        let rDesc = id.startsWith('cons_') ? i18n.t(`consumables.${id}.desc`) : (i18n.t(`relics.${id}.desc`) || r.desc);

        let container = document.createElement('div');
        let nameSpan = document.createElement('span');
        nameSpan.className = "text-amber-400 font-black";
        nameSpan.textContent = rName;

        let descSpan = document.createElement('span');
        descSpan.className = "text-sm md:text-lg text-slate-200 mt-2 block";

        let fusionText = '';
        if (r.rarity === 5 && FUSION_RECIPES[r.id]) {
            let mat1Id = FUSION_RECIPES[r.id].mat1;
            let mat2Id = FUSION_RECIPES[r.id].mat2;
            let mat1Def = RELIC_DB.find(x => x.id === mat1Id);
            let mat2Def = RELIC_DB.find(x => x.id === mat2Id);
            let mat1Name = mat1Def ? (i18n.t(`relics.${mat1Id}.name`) || mat1Def.name) : mat1Id;
            let mat2Name = mat2Def ? (i18n.t(`relics.${mat2Id}.name`) || mat2Def.name) : mat2Id;
            fusionText = i18n.t('ui.fusion_condition', mat1Name, mat2Name);
        }

        descSpan.textContent = rDesc + fusionText;

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
                        if (d.matchedGroups['A'] || d.matchedGroups['B'] || d.matchedGroups['C'] || d.matchedGroups['D']) {
                            innerColor = "bg-blue-900"; outerColor = "bg-blue-400"; textColor = "text-blue-200"; extraClass = "drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]";
                        }
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

    el.rollsBadge.innerText = i18n.t('ui.rolls_left', battle.rollsLeft);
    el.rollsBadge.className = battle.rollsLeft === 0 ? "bg-slate-700 px-2 py-0.5 rounded-full text-[10px] md:text-sm font-bold text-slate-400 transition-colors" : "bg-slate-700 px-2 py-0.5 rounded-full text-[10px] md:text-sm font-bold text-amber-300 transition-colors";
}

// --- 控制器渲染 ---
export function renderControls(battle) {
    if (battle.state === 'IDLE') { el.controlsContainer.innerHTML = ''; return; }
    let isRolling = battle.state === 'ROLLING', isAttacking = battle.state === 'ATTACKING';

    let isRollDisabled = (battle.rollsLeft <= 0 || isRolling || isAttacking);
    let rollClass = isRollDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500 active:scale-95";

    let isScoreDisabled = (isRolling || isAttacking);
    let scoreClass = isScoreDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500 active:scale-95 shadow-lg shadow-red-900/50";

    el.controlsContainer.innerHTML = `
    <button onclick="window.executeRoll(false)" ${isRollDisabled ? 'disabled="disabled"' : ''} class="w-full flex-1 bg-blue-600 text-white font-black rounded-lg md:rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 ${rollClass}">
        <span class="text-sm md:text-lg leading-tight">${i18n.t('ui.btn_roll')}</span>
        <span class="text-[8px] md:text-[10px] opacity-90 mt-0.5 font-bold">${i18n.t('ui.btn_roll_hint')}</span>
    </button>
    <button onclick="window.fireAttack()" ${isScoreDisabled ? 'disabled="disabled"' : ''} class="w-full flex-[1.5] bg-red-600 text-white font-black rounded-lg md:rounded-xl transition-all flex flex-col items-center justify-center border-b-4 border-red-800 active:border-b-0 active:translate-y-1 ${scoreClass}">
        <span class="text-lg md:text-2xl mb-0.5">🗡️</span>
        <span class="text-xs md:text-base leading-tight">${i18n.t('ui.btn_attack')}</span>
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


    const getTagLocalName = (tagName) => {
        if (!tagName) return '';
        const map = {"無":"messages.none","undefined":"rules.groupD_desc.name","八重奏":"rules.rule_a0.name","七同":"rules.rule_a1.name","六同":"rules.rule_a2.name","五同":"rules.rule_a3.name","四同":"rules.rule_a4.name","三同":"rules.rule_a5.name","對子":"rules.rule_a6.name","大滿貫":"rules.rule_b0.name","七連順":"rules.rule_b1.name","六連順":"rules.rule_b2.name","五連順":"rules.rule_b3.name","四連順":"rules.rule_b4.name","三連順":"rules.rule_b5.name","雙子星":"rules.rule_c0.name","葫蘆":"rules.rule_c1.name","豪華四對子":"rules.rule_c2.name","三龍會":"rules.rule_c3.name","經典四對子":"rules.rule_c4.name","雙四連順":"rules.rule_c5.name","中葫蘆":"rules.rule_c6.name","平胡":"rules.rule_c7.name","碰碰胡":"rules.rule_c8.name","順碰交響曲":"rules.rule_c9.name","雙三連順":"rules.rule_c10.name","雙三同":"rules.rule_c11.name","小葫蘆":"rules.rule_c12.name","三對子":"rules.rule_c13.name","雙對子":"rules.rule_c14.name","兩極":"rules.rule_d0.name","絕對秩序":"rules.rule_d1.name","全異":"rules.rule_d2.name","中庸之道":"rules.rule_d3.name"};
        let key = map[tagName];
        if (key) {
            return window.i18n ? window.i18n.t(key) : tagName;
        }
        return tagName;
    };

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
        <div class="text-[11px] md:text-sm font-bold text-slate-400 whitespace-nowrap">${i18n.t('ui.score_total_base')}: <span class="text-sm md:text-base font-black text-white ml-1">${res.totalBase.toFixed(1)}</span></div>
        <div class="flex overflow-x-auto gap-1 pb-1 scroll-smooth hide-scrollbar">${notesHtml}</div>
    </div>
    
    <div class="grid grid-cols-4 gap-1.5 mb-1">
        <div onclick="window.setHighlight('A')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border min-w-0 overflow-hidden ${getBoxStyle('A', res.tagA)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90 w-full px-1 text-center">${getTagLocalName(res.tagA.name)}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagA.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('B')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border min-w-0 overflow-hidden ${getBoxStyle('B', res.tagB)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90 w-full px-1 text-center">${getTagLocalName(res.tagB.name)}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagB.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('C')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border min-w-0 overflow-hidden ${getBoxStyle('C', res.tagC)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90 w-full px-1 text-center">${getTagLocalName(res.tagC.name)}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagC.multi.toFixed(1)}</div>
        </div>
        <div onclick="window.setHighlight('D')" class="flex flex-col items-center justify-center py-1.5 rounded-lg border min-w-0 overflow-hidden ${getBoxStyle('D', res.tagD)}">
            <div class="text-[11px] md:text-xs font-bold truncate opacity-90 w-full px-1 text-center">${getTagLocalName(res.tagD.name)}</div>
            <div class="font-black text-sm md:text-lg mt-0.5 leading-none">x${res.tagD.multi.toFixed(1)}</div>
        </div>
    </div>
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
        let btnClass = "bg-yellow-600 hover:bg-yellow-500 text-white active:scale-95 shadow-md border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1";
        let style = RARITY[r.rarity];

        let isFusionMaterial = false;
        let fusionResultId = null;
        if (player && player.relics) {
            for (let fid in FUSION_RECIPES) {
                let rec = FUSION_RECIPES[fid];
                if ((rec.mat1 === r.id && player.relics.includes(rec.mat2)) ||
                    (rec.mat2 === r.id && player.relics.includes(rec.mat1))) {
                    isFusionMaterial = true;
                    fusionResultId = fid;
                    break;
                }
            }
        }

        let rName = r.id.startsWith('cons_') ? i18n.t(`consumables.${r.id}.name`) : (i18n.t(`relics.${r.id}.name`) || r.name);
        let rDesc = r.id.startsWith('cons_') ? i18n.t(`consumables.${r.id}.desc`) : (i18n.t(`relics.${r.id}.desc`) || r.desc);

        return `
        <div class="bg-slate-800 p-3 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-20 h-20 ${style.bg} blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div class="relative z-10">
                <div class="flex flex-col gap-1 mb-2">
                    <div class="flex justify-between items-start">
                        <h3 class="text-base md:text-xl font-black ${style.color}">${rName}</h3>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} font-bold">${i18n.t(`messages.rarity_${r.rarity}`) || style.label}</span>
                            ${isFusionMaterial ? `<span onclick="window.showFusionInfo('${fusionResultId}')" class="text-sm md:text-base cursor-pointer px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500 font-black shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse hover:bg-cyan-800 hover:scale-105 active:scale-95 transition-all">✨ ${i18n.t('ui.shop_fusion_hint') || '可融合'}</span>` : ''}
                        </div>
                    </div>
                </div>
                <p class="text-xs md:text-sm text-slate-300 mb-3 h-10 font-bold">${rDesc}</p>
            </div>
            <button onclick="window.buyItem(${idx})" class="w-full font-black py-2.5 rounded-lg transition-all relative z-10 text-sm md:text-base ${btnClass}">
                ${i18n.t('messages.shop_select')}
            </button>
        </div>`;
    }).join('');
    
    if(shopItems.length === 0) el.shopItemsContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-6 font-bold text-base">商店已經被你買空了！</div>`;
}

export function showFusionReplaceModal(currentFusions, newFusionId, callback) {
    if (!el.fusionReplaceModal || !el.fusionReplaceContent) return;

    let html = '';
    const allRelics = [...currentFusions, newFusionId];

    allRelics.forEach((id, index) => {
        let relic = RELIC_DB.find(r => r.id === id);
        if (!relic) return;

        let style = RARITY[relic.rarity] || RARITY[1];
        let isNew = (id === newFusionId);

        let rName = i18n.t(`relics.${relic.id}.name`) || relic.name;
        let rDesc = i18n.t(`relics.${relic.id}.desc`) || relic.desc;

        let materialsHtml = '';
        if (FUSION_RECIPES[id]) {
            let mat1 = RELIC_DB.find(x => x.id === FUSION_RECIPES[id].mat1);
            let mat2 = RELIC_DB.find(x => x.id === FUSION_RECIPES[id].mat2);
            // 取得素材的翻譯名稱
            let mat1Name = mat1 ? (i18n.t(`relics.${mat1.id}.name`) || mat1.name) : FUSION_RECIPES[id].mat1;
            let mat2Name = mat2 ? (i18n.t(`relics.${mat2.id}.name`) || mat2.name) : FUSION_RECIPES[id].mat2;
            
            // 使用語系檔中的 ui.fusion_materials (需要去語系檔補上這個 key)
            let returnMatText = i18n.t('ui.fusion_materials') || '退回素材：';
            materialsHtml = `<div class="text-[10px] md:text-xs text-amber-300/80 mt-2 border-t border-amber-900/50 pt-2">
                ${returnMatText}<br/>• ${mat1Name}<br/>• ${mat2Name}
            </div>`;
        }

        // 取得標籤與按鈕的翻譯 (需要去語系檔補上這些 key)
        let newFusionText = i18n.t('ui.fusion_new_item') || '本次合成';
        let discardBtnText = i18n.t('ui.fusion_discard_btn') || '捨棄並分解';

        // 修正右上角文字看不清楚的問題：將原本的 right-8 改為 right-6，並稍微增加 padding
        html += `
        <div class="bg-slate-900/80 border-2 ${isNew ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-slate-600'} rounded-xl p-3 md:p-4 flex flex-col justify-between h-full relative overflow-hidden">
            ${isNew ? `<div class="absolute -top-1 -right-6 bg-amber-500 text-slate-900 text-[10px] font-black px-10 py-1 rotate-45">${newFusionText}</div>` : ''}
            <div>
                <div class="flex justify-between items-start mb-2 mt-2">
                    <h3 class="text-base md:text-lg font-black ${style.color}">${rName}</h3>
                    <span class="text-[10px] md:text-xs px-2 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} font-bold z-10 relative">${i18n.t(`messages.rarity_${relic.rarity}`) || style.label}</span>
                </div>
                <p class="text-xs md:text-sm text-slate-300 font-bold mb-3">${rDesc}</p>
                ${materialsHtml}
            </div>

            <button onclick="window.selectFusionDiscard('${id}')" class="w-full mt-4 bg-red-950/80 hover:bg-red-900 border border-red-800 hover:border-red-500 text-red-400 hover:text-white font-black py-2.5 rounded-lg transition-all active:scale-95 text-sm md:text-base">
                ${discardBtnText}
            </button>
        </div>
        `;
    });

    el.fusionReplaceContent.innerHTML = html;

    // Attach the callback globally so the onclick handler can access it
    window._fusionReplaceCallback = callback;

    window.selectFusionDiscard = function(selectedId) {
        el.fusionReplaceModal.classList.add('hidden');
        el.fusionReplaceModal.classList.remove('flex');
        if (window._fusionReplaceCallback) {
            window._fusionReplaceCallback(selectedId);
            window._fusionReplaceCallback = null;
        }
    };

    el.fusionReplaceModal.classList.remove('hidden');
    el.fusionReplaceModal.classList.add('flex');
}

export function updateShopRerollBtn(shopRerollsUsed, hasScavenger = false, hasFusionRecycle = false) {
    if (shopRerollsUsed === 0) {
        // 動態抓取 ui.btn_reroll 語系鍵
        el.shopRerollBtn.innerHTML = i18n.t('ui.btn_reroll') || "🔄 刷新商店 (限1次)";
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-colors active:scale-95 text-base md:text-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-900/50";
        el.shopRerollBtn.disabled = false;
    } else {
        el.shopRerollBtn.innerHTML = i18n.t('shop_rerolled');
        el.shopRerollBtn.className = "w-full sm:w-auto flex-1 bg-slate-700 text-slate-400 font-black py-3 rounded-xl cursor-not-allowed text-base md:text-lg border-b-4 border-slate-900";
        el.shopRerollBtn.disabled = true;
    }
}

export function renderHistoryModal(records, metaData) {

    let pbHtml = '';
    if (metaData && metaData.stats) {
        // Find best combination local name using existing DB
        let comboTag = metaData.stats.highestDamageCombo;
        let comboKey = '';
        if(comboTag === '無') comboKey = 'messages.none';
        else {
           for (let g of ['groupA', 'groupB', 'groupC', 'groupD']) {
               let found = window.RULE_DB?.[g]?.find(r=>r.name === comboTag);
               if(found) {
                  let idx = window.RULE_DB[g].indexOf(found);
                  if(g==='groupA') comboKey = 'rules.rule_a'+idx+'.name';
                  else if(g==='groupB') comboKey = 'rules.rule_b'+idx+'.name';
                  else if(g==='groupC') comboKey = 'rules.rule_c'+idx+'.name';
                  else if(g==='groupD') comboKey = 'rules.rule_d'+idx+'.name';
                  break;
               }
           }
        }
        let highestDamageComboTranslated = (comboKey && window.i18n) ? window.i18n.t(comboKey) : comboTag;

        pbHtml = `
            <div class="bg-amber-900/40 border border-amber-600/50 p-4 rounded-xl mb-6 shadow-inner">
                <h3 class="text-lg font-black text-amber-400 mb-3 flex items-center gap-2">${i18n.t('ui.pb_title') || '🏆 個人最佳紀錄'}</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <div class="text-xs text-amber-200/70 font-bold">${i18n.t('ui.pb_highest_dmg') || '最高傷害'}</div>
                        <div class="text-xl font-black text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">${Math.floor(metaData.stats.highestDamage).toLocaleString()}</div>
                        <div class="text-[10px] text-amber-400/80 mt-0.5">${highestDamageComboTranslated}</div>
                    </div>
                    <div>
                        <div class="text-xs text-amber-200/70 font-bold">${i18n.t('ui.pb_highest_multi') || '最高倍率'}</div>
                        <div class="text-xl font-black text-emerald-400">x${metaData.stats.highestMulti.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</div>
                    </div>
                    <div>
                        <div class="text-xs text-amber-200/70 font-bold">${i18n.t('ui.pb_highest_infinite') || '最高無限層數'}</div>
                        <div class="text-xl font-black text-purple-400">${metaData.stats.highestInfiniteLevel > 0 ? metaData.stats.highestInfiniteLevel : '-'}</div>
                    </div>
                </div>
                <div class="mt-3 flex overflow-x-auto gap-1 hide-scrollbar">
                    ${metaData.stats.highestDamageRelics.map(r => `<img src="${window.RELIC_DB[r]?.icon || 'img/relic_placeholder.png'}" class="w-6 h-6 rounded-md border border-slate-600 shadow-sm" title="${window.RELIC_DB[r]?.name}">`).join('')}
                </div>
            </div>
        `;
    }

    if (!records || records.length === 0) {
        el.historyContent.innerHTML = pbHtml + `<div class="text-center text-slate-500 py-6 font-bold">${i18n.t('messages.history_empty')}</div>`;
        return;
    }
    
    el.historyContent.innerHTML = pbHtml + records.map((r, i) => {
        let resultColor = r.win ? "text-amber-400" : "text-red-400";
        let resultText = r.stageName || (r.win ? "勝利" : "失敗"); // This is saved in DB, so it might be hard to translate retrospectively.
        let dateObj = new Date(r.date);
        let dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let relicHtml = (r.relics && r.relics.length > 0) ? r.relics.map(id => {
            let relicDef = RELIC_DB.find(x => x.id === id);
            if (!relicDef) return '';
            let rName = id.startsWith('cons_') ? i18n.t(`consumables.${id}.name`) : (i18n.t(`relics.${id}.name`) || relicDef.name);
            return `<span class="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300 mr-1 mb-1 inline-block">${rName}</span>`;
        }).join('') : '<span class="text-slate-500 text-[10px]">' + i18n.t('messages.none') + '</span>';
        
        return `
        <div class="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-1 relative overflow-hidden">
            <div class="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                <span class="font-black ${resultColor} text-sm md:text-base">${resultText}</span>
                <span class="text-[10px] md:text-xs text-slate-400">${dateStr}</span>
            </div>
            <div class="text-xs md:text-sm text-slate-300">
                <span class="text-slate-500">${i18n.t("messages.history_dmg_label")}:</span> <span class="font-black text-white">${Number(r.highestDamage).toLocaleString()}</span>
            </div>
            <div class="text-xs md:text-sm text-slate-300">
                <span class="text-slate-500">${i18n.t("messages.history_combo_label")}:</span> <span class="font-bold text-blue-300">${r.combo || i18n.t('messages.none')}</span>
            </div>
            <div class="mt-1">
                <div class="text-[10px] text-slate-500 mb-0.5">${i18n.t("messages.history_relics_label")}:</div>
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
        let rName = id.startsWith('cons_') ? i18n.t(`consumables.${id}.name`) : (i18n.t(`relics.${id}.name`) || relicDef.name);
        return `<span class="${style.bg} ${style.color} px-2 py-1 rounded text-xs border ${style.border} inline-block">${rName}</span>`;
    }).join(' ') : '<span class="text-slate-500">' + i18n.t('messages.none') + '</span>';
    
    el.endStats.innerHTML = `
        <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 w-full max-w-sm mx-auto shadow-inner text-left">
            <div class="mb-2 border-b border-slate-700/50 pb-2">
                <div class="text-xs text-slate-400 mb-1">${i18n.t('messages.history_dmg_label')}</div>
                <div class="text-2xl md:text-3xl font-black text-white">${Number(highestDamage).toLocaleString()}</div>
                <div class="text-sm font-bold text-blue-300 mt-1">${highestDamageCombo || i18n.t('messages.none')}</div>
            </div>
            <div>
                <div class="text-xs text-slate-400 mb-1.5">${i18n.t('messages.history_relics_label')}</div>
                <div class="flex overflow-x-auto gap-1 pb-1 scroll-smooth hide-scrollbar">${relicHtml}</div>
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
            { key: 'groupA', titleKey: 'rules.groupA_desc' },
            { key: 'groupB', titleKey: 'rules.groupB_desc' },
            { key: 'groupC', titleKey: 'rules.groupC_desc' },
            { key: 'groupD', titleKey: 'rules.groupD_desc' }
        ];
        groups.forEach(g => {
            html += `<h3 class="text-base md:text-lg font-black text-slate-300 mt-2 mb-1 border-b border-slate-700 pb-1">${i18n.t(g.titleKey)}</h3>`;
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">`;
            RULE_DB[g.key].forEach((rule, rIdx) => {
                const unlocked = coll.hands.includes(rule.name);
                let letter = g.key.replace('group', '').toLowerCase();
                let ruleName = i18n.t(`rules.rule_${letter}${rIdx}.name`) || rule.name;
                let ruleDesc = i18n.t(`rules.rule_${letter}${rIdx}.desc`) || rule.desc;

                const nameStr = unlocked ? `${ruleName} <span class="text-emerald-400 text-xs ml-1">✅</span>` : `???`;
                const descStr = unlocked ? ruleDesc : i18n.t('locked'); // Hardcoded fallback for now
                const opacity = unlocked ? 'opacity-100' : 'opacity-50 grayscale';
                let rStyle = RARITY[rule.rarity] || RARITY[1];
                let nameColor = unlocked ? rStyle.color : 'text-slate-200';
                html += `
                <div class="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700 ${opacity}">
                    <div>
                        <div class="flex items-center gap-2">
                            <div class="text-sm md:text-base font-bold ${nameColor}">${nameStr}</div>
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
                let rName = r.id.startsWith('cons_') ? i18n.t(`consumables.${r.id}.name`) : (i18n.t(`relics.${r.id}.name`) || r.name);
                let rDesc = r.id.startsWith('cons_') ? i18n.t(`consumables.${r.id}.desc`) : (i18n.t(`relics.${r.id}.desc`) || r.desc);

                let fusionText = '';
                if (r.rarity === 5 && FUSION_RECIPES[r.id]) {
                    let mat1Id = FUSION_RECIPES[r.id].mat1;
                    let mat2Id = FUSION_RECIPES[r.id].mat2;
                    let mat1Def = RELIC_DB.find(x => x.id === mat1Id);
                    let mat2Def = RELIC_DB.find(x => x.id === mat2Id);
                    let mat1Name = mat1Def ? (i18n.t(`relics.${mat1Id}.name`) || mat1Def.name) : mat1Id;
                    let mat2Name = mat2Def ? (i18n.t(`relics.${mat2Id}.name`) || mat2Def.name) : mat2Id;
                    fusionText = `<p class="text-xs text-amber-300 mt-1 border-t border-slate-600 pt-1">${i18n.t('ui.fusion_text_short', mat1Name, mat2Name)}</p>`;
                }
                html += `
                <div class="bg-slate-800 p-2 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black ${style.color}">${rName} <span class="text-emerald-400 text-xs ml-1">✅</span></h3>
                        <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} font-bold">${i18n.t(`messages.rarity_${r.rarity}`) || style.label}</span>
                    </div>
                    <p class="text-xs md:text-sm text-slate-300 font-bold">${rDesc}</p>
                    ${fusionText}
                </div>`;
            } else {
                html += `
                <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col justify-between relative overflow-hidden opacity-50">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black text-slate-500">???</h3>
                    </div>
                    <p class="text-xs md:text-sm text-slate-600 font-bold">${i18n.t('locked_relic')}</p>
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
                let sName = i18n.t(`shackles.${s.id}.name`) || s.name;
                let sDesc = i18n.t(`shackles.${s.id}.desc`) || s.desc;
                html += `
                <div class="bg-slate-800 p-2 rounded-xl border border-slate-600 flex flex-col justify-between relative overflow-hidden">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black ${colorClass}">${sName} <span class="text-emerald-400 text-xs ml-1">✅</span></h3>
                        <span class="text-[9px] md:text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-500 font-bold">${typeLabel}</span>
                    </div>
                    <p class="text-xs md:text-sm text-slate-300 font-bold">${sDesc}</p>
                </div>`;
            } else {
                html += `
                <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col justify-between relative overflow-hidden opacity-50">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-sm md:text-base font-black text-slate-500">???</h3>
                    </div>
                    <p class="text-xs md:text-sm text-slate-600 font-bold">${i18n.t('locked_shackle')}</p>
                </div>`;
            }
        });
        html += `</div>`;
    }
    
    el.collectionContent.innerHTML = html;
}


window.openDevModal = function() {
    if (!el.devModal || !el.devRelicSelect) return;
    el.devRelicSelect.innerHTML = '<option value="">-- 請選擇遺物 --</option>';
    RELIC_DB.forEach(r => {
        let opt = document.createElement('option');
        opt.value = r.id;
        opt.innerText = `${r.name} (${r.id})`;
        el.devRelicSelect.appendChild(opt);
    });
    el.devModal.classList.remove('hidden');
    el.devModal.classList.add('flex');
};

window.closeDevModal = function() {
    if (!el.devModal) return;
    el.devModal.classList.add('hidden');
    el.devModal.classList.remove('flex');
};

if (el.devRelicCancel) {
    el.devRelicCancel.onclick = window.closeDevModal;
}

export function renderSoulsModal(metaData) {
    if (!el.soulsContent) return;
    el.soulsHeaderText.innerText = i18n.t('souls.owned', metaData.souls);

    el.soulsContent.innerHTML = SOULS_UPG_DEFS.map(u => {
        let currentLv = metaData.upgrades[u.id] || 0;
        let isMax = currentLv >= u.max;
        let currentCost = u.cost(currentLv);
        let canAfford = metaData.souls >= currentCost;

        let uName = i18n.t(`souls.${u.id}.name`) || u.name;
        let uDesc = i18n.t(`souls.${u.id}.desc`) || u.desc;

        let dots = Array(u.max).fill().map((_, i) => i < currentLv ? '🟢' : '⚫').join(' ');
        let btnHtml = isMax
            ? `<button disabled class="bg-slate-700 text-slate-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">${i18n.t('souls.maxed')}</button>`
            : `<button onclick="window.buySoulUpgrade('${u.id}', ${currentCost})" class="${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'} font-black py-2 px-4 rounded-lg transition-transform active:scale-95" ${canAfford ? '' : 'disabled'}>${i18n.t('souls.cost', currentCost)}</button>`;

        return `
        <div class="bg-slate-900/50 border border-indigo-900/50 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <div class="text-base font-black text-indigo-300">${uName}</div>
                <div class="text-xs text-slate-400 mt-0.5">${uDesc}</div>
                <div class="text-xs mt-1">${dots} (${currentLv}/${u.max})</div>
            </div>
            <div class="w-full sm:w-auto text-right">
                ${btnHtml}
            </div>
        </div>
        `;
    }).join('');

    el.soulsContent.innerHTML += `
        <div class="mt-4 pt-4 border-t border-slate-700/50">
            <button onclick="window.resetSouls()" class="w-full bg-red-600/80 hover:bg-red-500/80 text-white py-2 rounded font-bold transition-colors">${i18n.t('ui.reset_souls') || '重置靈魂 (退還所有花費)'}</button>
        </div>
    `;
}

window.buySoulUpgrade = function(id, cost) {
    let meta = window.getMetaData();
    if (meta.souls >= cost) {
        meta.souls -= cost;
        meta.upgrades[id] = (meta.upgrades[id] || 0) + 1;
        window.saveMetaData();
        renderSoulsModal(meta);
    } else {
        showToast(i18n.t('messages.toast_no_money'));
    }
};


window.resetSouls = function() {
    let meta = window.getMetaData();
    let totalRefund = 0;

    for (let u of SOULS_UPG_DEFS) {
        let level = meta.upgrades[u.id] || 0;
        for (let i = 0; i < level; i++) {
            totalRefund += u.cost(i);
        }
        meta.upgrades[u.id] = 0;
    }

    meta.souls += totalRefund;
    window.saveMetaData();

    renderSoulsModal(meta);
};
