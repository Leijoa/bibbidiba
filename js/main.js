// js/main.js
import { RELIC_DB, ENEMY_DB, getEnemy } from './data.js';
import { calculateEngineScore } from './engine.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';

// --- 遊戲狀態 ---
let player = { hp: 3, gold: 0, relics: [], maxRolls: 2 };
let stage = { level: 0, enemyMaxHp: 0, enemyHp: 0, turnsLeft: 0, activeShackle: null, shackleMeta: null };
let battle = { state: 'IDLE', dice: Array(8).fill().map((_, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} })), rollsLeft: 0, scoreResult: null };
let shopItems = [];
let shopRerollsUsed = 0;
let activeHighlight = null;
const SAVE_KEY = 'bibbidiba_save_v30';
const HISTORY_KEY = 'bibbidiba_history_v30';
const COLLECTION_KEY = 'bibbidiba_collection_v35';

// 收集冊狀態
let collection = {
    hands: [],
    relics: [],
    shackles: []
};

// --- 安全存儲解析 (Secure Storage Parsing) ---
function secureParseStorage(key, fallbackValue, validatorFn = null) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return fallbackValue;
        
        const parsed = JSON.parse(data);
        
        // Basic type check to prevent prototype pollution or non-object evaluation
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) !== Array.isArray(fallbackValue)) {
            console.warn(`[Security] Invalid structure for ${key}, falling back to default.`);
            return fallbackValue;
        }

        // Custom validation (schema checking) if provided
        if (validatorFn && !validatorFn(parsed)) {
             console.warn(`[Security] Validation failed for ${key}, falling back to default.`);
             return fallbackValue;
        }
        
        return parsed;
    } catch (e) {
        console.error(`[Security] JSON parse error for ${key}:`, e);
        return fallbackValue;
    }
}

function loadCollection() {
    collection = secureParseStorage(COLLECTION_KEY, { hands: [], relics: [], shackles: [] }, (data) => {
        return Array.isArray(data.hands) && Array.isArray(data.relics) && Array.isArray(data.shackles);
    });
}

function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

function unlockCollectionItem(type, id) {
    if (type === 'hand' && !collection.hands.includes(id)) {
        collection.hands.push(id);
        saveCollection();
    } else if (type === 'relic' && !collection.relics.includes(id)) {
        collection.relics.push(id);
        saveCollection();
    } else if (type === 'shackle' && !collection.shackles.includes(id)) {
        collection.shackles.push(id);
        saveCollection();
    }
}

window.unlockCollectionItem = unlockCollectionItem; // Export for external usage if needed
window.getCollection = () => collection;
window.getStageActiveShackle = () => stage.activeShackle;
window.getShackleMeta = () => stage.shackleMeta;

// --- Modular Game Loop Hooks ---
function applyCombatShackles(dmg, actualDamage, isEnemyDefeated) {
    if (!stage.activeShackle) return false; // Returns true if player dies from recoil

    let playerDied = false;

    if (stage.activeShackle === 'vampire' && !isEnemyDefeated) {
        let lostGold = Math.min(5, player.gold);
        if (lostGold > 0) {
            player.gold -= lostGold;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`🩸 【吸血鬼】發動：被偷走 ${lostGold} 金幣！`);
        }
    }

    if (stage.activeShackle === 'thief' && !isEnemyDefeated) {
        let lostGold = Math.min(2, player.gold);
        if (lostGold > 0) {
            player.gold -= lostGold;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`🦹 【小偷】發動：被偷走 ${lostGold} 金幣！`);
        }
    }

    if (stage.activeShackle === 'thornarmor') {
        let threshold = stage.enemyMaxHp * 0.10;
        if (dmg < threshold) {
            player.hp--;
            if (player.relics.includes('berserker')) {
                player.berserkerBonus = (player.berserkerBonus || 0) + 1;
                UI.showToast("💢 【越戰越勇】發動：永久增加 1 次重骰次數！");
            }
            UI.updateHeaderUI(player, stage);
            UI.showToast(`🛡️ 【反傷裝甲】發動：傷害過低，受到 1 點反傷！`);
            if (player.hp <= 0) playerDied = true;
        }
    }

                UI.showToast(`💥 【同歸於盡】發動：血量只剩 1，免於致死反彈！`);
            }
        }
    }

    return playerDied;
}

function applyEconomyShackles(items) {
    let result = items;
    if (stage.activeShackle === 'inflation') {
        result = result.map(item => ({
            ...item,
            price: Math.ceil(item.price * 1.2)
        }));
    }
    if (player.relics.includes('vip')) {
        result = result.map(item => ({
            ...item,
            price: Math.floor(item.price * 0.8)
        }));
    }
    return result;
}

// --- 存檔系統 (Save System) ---
function saveGame() {
    let inShop = !UI.el.shopOverlay.classList.contains('hidden');
    const saveData = {
        player: {
            ...player
        },
        stage: {
            level: stage.level,
            enemyMaxHp: stage.enemyMaxHp,
            enemyHp: stage.enemyHp,
            turnsLeft: stage.turnsLeft,
            activeShackle: stage.activeShackle,
            shackleMeta: stage.shackleMeta
        },
        battle: {
            state: battle.state,
            dice: battle.dice,
            rollsLeft: battle.rollsLeft,
            scoreResult: battle.scoreResult
        },
        shop: inShop ? { active: true, items: shopItems, rerolls: shopRerollsUsed } : { active: false }
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
    const parsed = secureParseStorage(SAVE_KEY, null, (data) => {
        return data && typeof data.player === 'object' && typeof data.stage === 'object' && typeof data.battle === 'object';
    });
    
    if (parsed) {
        player = parsed.player;
        UI.el.titleScreen.classList.add('hidden');

        if (parsed.shop && parsed.shop.active) {
            stage.level = parsed.stage.level;
            stage.activeShackle = parsed.stage.activeShackle || null;
            stage.shackleMeta = parsed.stage.shackleMeta || null;
            let enemy = getEnemy(stage.level);
            stage.enemyMaxHp = enemy.hp;
            stage.enemyHp = 0; // 已經擊敗
            stage.turnsLeft = enemy.turns;

            shopItems = parsed.shop.items || [];
            shopRerollsUsed = parsed.shop.rerolls || 0;

            renderAll();
            UI.el.shopOverlay.classList.remove('hidden');
            UI.el.shopOverlay.classList.add('flex');
            UI.updateShopRerollBtn(shopRerollsUsed);
            UI.el.shopGold.innerText = player.gold;
            UI.renderShopItems(shopItems, player);
        } else {
            loadStage(parsed.stage.level, true, parsed);
        }
    }
}

function clearSave() {
    localStorage.removeItem(SAVE_KEY);
}

function checkSaveExists() {
    if (localStorage.getItem(SAVE_KEY)) {
        UI.el.btnContinue.classList.remove('hidden');
    }
}

// --- 初始化與主流程 ---
function initTitleScreen() {
    UI.renderRulesDB();
    checkSaveExists();

    UI.el.btnNewGame.onclick = () => {
        clearSave();
        UI.el.titleScreen.classList.add('hidden');
        initNewGame();
    };
    UI.el.btnContinue.onclick = () => {
        UI.el.titleScreen.classList.add('hidden');
        loadGame();
    };

    document.getElementById('btn-rules').onclick = () => UI.el.rulesModal.classList.remove('hidden');
    document.getElementById('btn-close-rules').onclick = () => UI.el.rulesModal.classList.add('hidden');

    if (UI.el.btnHistory && UI.el.historyModal && UI.el.btnCloseHistory) {
        UI.el.btnHistory.onclick = () => {
            let history = secureParseStorage(HISTORY_KEY, [], (data) => Array.isArray(data));
            UI.renderHistoryModal(history);
            UI.el.historyModal.classList.remove('hidden');
        };
        UI.el.btnCloseHistory.onclick = () => UI.el.historyModal.classList.add('hidden');
    }

    if (UI.el.btnCollection && UI.el.collectionModal && UI.el.btnCloseCollection) {
        let currentTab = 'hands';
        const updateTabUI = () => {
            UI.el.tabHands.className = currentTab === 'hands' ? "flex-1 py-2 text-sm font-bold text-emerald-400 bg-slate-800 transition-colors border-b-2 border-emerald-500" : "flex-1 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border-b-2 border-transparent";
            UI.el.tabRelics.className = currentTab === 'relics' ? "flex-1 py-2 text-sm font-bold text-emerald-400 bg-slate-800 transition-colors border-b-2 border-emerald-500" : "flex-1 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border-b-2 border-transparent";
            UI.el.tabShackles.className = currentTab === 'shackles' ? "flex-1 py-2 text-sm font-bold text-emerald-400 bg-slate-800 transition-colors border-b-2 border-emerald-500" : "flex-1 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border-b-2 border-transparent";
            UI.renderCollectionModal(currentTab);
        };

        UI.el.btnCollection.onclick = () => {
            currentTab = 'hands';
            updateTabUI();
            UI.el.collectionModal.classList.remove('hidden');
        };
        UI.el.btnCloseCollection.onclick = () => UI.el.collectionModal.classList.add('hidden');
        
        UI.el.tabHands.onclick = () => { currentTab = 'hands'; updateTabUI(); };
        UI.el.tabRelics.onclick = () => { currentTab = 'relics'; updateTabUI(); };
        UI.el.tabShackles.onclick = () => { currentTab = 'shackles'; updateTabUI(); };
    }

    UI.el.shopRerollBtn.onclick = () => window.rerollShop(false);
    document.getElementById('btn-next-stage').onclick = () => {
        if (UI.el.shopOverlay.classList.contains('hidden')) return;
        nextStage();
    };
    document.getElementById('btn-restart').onclick = () => location.reload();

    let btnInfinite = document.getElementById('btn-infinite');
    if (btnInfinite) {
        btnInfinite.onclick = () => {
            player.isInfiniteMode = true;
            UI.el.endOverlay.classList.add('hidden');
            document.getElementById('btn-restart').classList.remove('hidden');
            btnInfinite.classList.add('hidden');
            enemyDefeated(); // Proceed to shop as if enemy was defeated normally
        };
    }

    let btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
        btnSound.onclick = () => {
            let enabled = Audio.toggleSound();
            btnSound.innerText = enabled ? '🔈 音效: 開' : '🔈 音效: 關';
        };
    }
}

import { SHACKLE_DB } from './data.js';

function initNewGame() {
    player = { hp: 3, gold: 20, relics: [], maxRolls: 2, highestDamage: 0, highestDamageCombo: '', isInfiniteMode: false };
    loadStage(0);
}

function assignShackleForStage(levelIndex) {
    let shackleType = null;
    if (levelIndex < ENEMY_DB.length) {
        if (levelIndex === 2) shackleType = 'light';
        else if (levelIndex === 4) shackleType = 'heavy';
    } else {
        let infiniteLevel = levelIndex - ENEMY_DB.length + 1;
        let m = ((infiniteLevel - 1) % 3) + 1;
        shackleType = (m === 3) ? 'heavy' : 'light';
    }
    
    if (shackleType) {
        let candidates = SHACKLE_DB.filter(s => s.type === shackleType);
        let selected = candidates[Math.floor(Math.random() * candidates.length)];
        
        let meta = null;
        if (selected.id === 'parityfear') {
            meta = { fearType: Math.random() > 0.5 ? 'odd' : 'even' };
        } else if (selected.id === 'numberplunder') {
            meta = { targetNumber: Math.floor(Math.random() * 8) + 1 };
        } else if (selected.id === 'illusion') {
            meta = { fakeNumber: Math.floor(Math.random() * 8) + 1 };
        } else if (selected.id === 'dizziness') {
            meta = { displayOrder: [0, 1, 2, 3, 4, 5, 6, 7] };
        } else if (selected.id === 'inversion') {
            let colors = ['bg-slate-500', 'bg-blue-600', 'bg-pink-600', 'bg-purple-600', 'bg-teal-600', 'bg-emerald-900', 'bg-red-600', 'bg-amber-600'];
            meta = { colorMap: colors.sort(() => Math.random() - 0.5) };
        } else if (selected.id === 'blind') {
            meta = { blindIndices: [] };
        } else if (selected.id === 'wither') {
            meta = { originalHp: player.hp };
        } else if (selected.id === 'cursedlock') {
            meta = { cursedId: null };
        } else if (selected.id === 'relicseal') {
            let shuffled = [...player.relics].sort(() => 0.5 - Math.random());
            meta = { ignoredRelics: shuffled.slice(0, 2) };
        }
        
        return { id: selected.id, meta: meta };
    }
    return { id: null, meta: null };
}

function loadStage(levelIndex, isLoad = false, parsedData = null) {
    if (levelIndex >= ENEMY_DB.length && !player.isInfiniteMode) return gameWin();
    stage.level = levelIndex;
    let enemy = getEnemy(levelIndex);
    stage.enemyMaxHp = enemy.hp;

    if (isLoad && parsedData && parsedData.stage) {
        stage.enemyHp = parsedData.stage.enemyHp ?? enemy.hp;
        stage.turnsLeft = parsedData.stage.turnsLeft ?? enemy.turns;
        stage.activeShackle = parsedData.stage.activeShackle || null;
        stage.shackleMeta = parsedData.stage.shackleMeta || null;

        if (parsedData.player && parsedData.player.isInfiniteMode !== undefined) {
            player.isInfiniteMode = parsedData.player.isInfiniteMode;
        }

        if (parsedData.battle) {
            battle.state = parsedData.battle.state;
            if (battle.state === 'ROLLING' || battle.state === 'ATTACKING') {
                battle.state = 'WAIT_ACTION';
            }
            battle.dice = parsedData.battle.dice || battle.dice;
            battle.rollsLeft = parsedData.battle.rollsLeft;
            battle.scoreResult = parsedData.battle.scoreResult;
        }
    } else {
        stage.enemyHp = enemy.hp;
        stage.turnsLeft = enemy.turns;
        stage.hasAttackedThisStage = false;
        
        let shackleAssignment = assignShackleForStage(levelIndex);
        stage.activeShackle = shackleAssignment.id;
        stage.shackleMeta = shackleAssignment.meta;
        
        if (stage.activeShackle === 'timecompress') {
            stage.turnsLeft = 2;
        }

        if (stage.activeShackle === 'wither') {
            player.hp = 1;
        }
        
        if (stage.activeShackle) {
            unlockCollectionItem('shackle', stage.activeShackle);
            let sDef = SHACKLE_DB.find(s => s.id === stage.activeShackle);
            if (sDef) {
                let extraMsg = "";
                if (stage.activeShackle === 'parityfear') {
                    extraMsg = `\n(本局目標：${stage.shackleMeta.fearType === 'odd' ? '奇數' : '偶數'})`;
                } else if (stage.activeShackle === 'numberplunder') {
                    extraMsg = `\n(本局目標數字：${stage.shackleMeta.targetNumber})`;
                }
                
                setTimeout(() => {
                    UI.showToast(`⚠️ 發現枷鎖！\n${sDef.name}: ${sDef.desc}${extraMsg}`);
                }, 500);
            }
        }
    }

    if (stage.shackleTimer) {
        clearTimeout(stage.shackleTimer);
        stage.shackleTimer = null;
    }

    if (stage.activeShackle === 'thalassophobia') {
        const triggerFear = () => {
            if (battle.state === 'IDLE' || battle.state === 'WAIT_ACTION') {
                let diceContainer = document.getElementById('dice-container');
                if (diceContainer) {
                    diceContainer.classList.add('deep-sea-anim');
                    setTimeout(() => diceContainer.classList.remove('deep-sea-anim'), 1000);
                }
            }
            stage.shackleTimer = setTimeout(triggerFear, 3000 + Math.random() * 5000);
        };
        stage.shackleTimer = setTimeout(triggerFear, 3000 + Math.random() * 5000);
    }

    UI.el.shopOverlay.classList.add('hidden');

    saveGame();
    renderAll();

    if (!isLoad || !parsedData || !parsedData.battle || battle.state === 'IDLE') {
        startTurn();
    }
}

function startTurn() {
    if (stage.turnsLeft <= 0) return gameOver("回合耗盡，未能擊敗敵人！");
    battle.state = 'IDLE';
    activeHighlight = null;

    if (stage.activeShackle === 'gluttony') {
        let healAmount = Math.floor(stage.enemyMaxHp * 0.05);
        if (stage.enemyHp < stage.enemyMaxHp) {
            stage.enemyHp = Math.min(stage.enemyMaxHp, stage.enemyHp + healAmount);
            UI.updateEnemyUI(stage);
            UI.showToast(`🍖 【貪吃】發動：敵人恢復 ${healAmount} HP！`);
        }
    }
    
    let baseMaxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2);
    if (stage.activeShackle === 'fatigue') {
        baseMaxRolls = Math.max(0, baseMaxRolls - 1);
    }
    if (stage.activeShackle === 'destinychain') {
        baseMaxRolls = 1;
    }
    
    player.maxRolls = baseMaxRolls;
    battle.rollsLeft = player.maxRolls;
    battle.dice = battle.dice.map((d, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} }));
    battle.scoreResult = null;
    saveGame();
    renderAll();
    window.executeRoll(true);
}

function renderAll() {
    UI.updateHeaderUI(player, stage);
    UI.updateEnemyUI(stage);
    UI.renderInventory(player);
    UI.renderDice(battle, activeHighlight);
    UI.renderControls(battle);
    UI.renderScore(battle, activeHighlight);
}

// --- 註冊給 UI onclick 呼叫的全域函式 ---
window.toggleLock = function(idx) {
    if (battle.state === 'WAIT_ACTION' && !activeHighlight) {
        if (stage.activeShackle === 'fragile') {
            return UI.showToast("⚠️ 【易碎骰子】無法鎖定骰子！");
        }
        
        if (stage.activeShackle === 'cursedlock' && stage.shackleMeta && battle.dice[idx].id === stage.shackleMeta.cursedId) {
            const diceEl = document.getElementById(`dice-element-${idx}`);
            if(diceEl) {
                diceEl.classList.remove('shake-hard');
                void diceEl.offsetWidth;
                diceEl.classList.add('shake-hard');
            }
            return UI.showToast("⛓️ 【詛咒之鎖】無法解鎖此骰子！");
        }

        if (stage.activeShackle === 'ultimatelock' && [2, 3, 4, 5].includes(idx)) {
            const diceEl = document.getElementById(`dice-element-${idx}`);
            if(diceEl) {
                diceEl.classList.remove('shake-hard');
                void diceEl.offsetWidth;
                diceEl.classList.add('shake-hard');
            }
            return UI.showToast("🔒 【終極封鎖】中間位置的骰子無法鎖定！");
        }
        
        let willLock = !battle.dice[idx].locked;

        battle.dice[idx].locked = willLock;
        
        if (stage.activeShackle === 'dizziness' && stage.shackleMeta && stage.shackleMeta.displayOrder) {
            stage.shackleMeta.displayOrder.sort(() => Math.random() - 0.5);
        }
        
        saveGame();
        UI.renderDice(battle, activeHighlight);
        const diceEl = document.getElementById(`dice-element-${idx}`);
        if(diceEl) {
            diceEl.classList.remove('pop-anim');
            void diceEl.offsetWidth;
            diceEl.classList.add('pop-anim');
        }
    }
};

window.setHighlight = function(group) {
    if (battle.state !== 'WAIT_ACTION') return;
    if (activeHighlight === group) activeHighlight = null;
    else activeHighlight = group;
    UI.renderDice(battle, activeHighlight);
    UI.renderScore(battle, activeHighlight);
};

window.executeRoll = function(isInitial = false) {
    if (!isInitial && battle.rollsLeft <= 0) return;
    if (battle.state === 'ROLLING' || battle.state === 'ATTACKING') return;

    if (!isInitial) {
        if (player.relics.includes('piggybank')) {
            if (player.gold >= 1) {
                player.gold -= 1;
                UI.updateHeaderUI(player, stage);
            } else {
                return UI.showToast("⚠️ 金幣不足！【存錢筒】每次重骰需支付 1 枚金幣。");
            }
        }

        if (stage.activeShackle === 'sticky') {
            let lockedCount = battle.dice.filter(d => d.locked).length;
            let cost = lockedCount * 3;
            if (cost > 0) {
                if (player.gold >= cost) {
                    player.gold -= cost;
                    UI.updateHeaderUI(player, stage);
                } else {
                    return UI.showToast("金幣不足無法重骰！");
                }
            }
        }

        if (stage.activeShackle === 'greedy') {
            if (player.gold >= 2) {
                player.gold -= 2;
                UI.updateHeaderUI(player, stage);
            } else {
                return UI.showToast("⚠️ 金幣不足，無法重骰！(需要 2 金幣)");
            }
        }
        
        if (stage.activeShackle === 'rebel') {
            let freed = 0;
            battle.dice.forEach(d => {
                if (d.locked && Math.random() < 0.25) {
                    d.locked = false;
                    freed++;
                }
            });
            if (freed > 0) UI.showToast(`😡 【叛逆】發動：${freed} 顆骰子掙脫鎖定！`);
        }
        
        if (player.relics.includes('balance') && battle.rollsLeft === player.maxRolls) {
            UI.showToast("⚖️ 【動態平衡】發動：首次重骰不消耗次數！");
        } else {
            battle.rollsLeft--;
        }
    }
    
    battle.state = 'ROLLING';
    activeHighlight = null;
    battle.dice.forEach(d => { d.matchedGroups = {A:false, B:false, C:false, D:false}; });
    saveGame();
    
    renderAll();

    let intervals = 0;
    let timer = setInterval(() => {
        Audio.playRollSound();
        battle.dice = battle.dice.map(d => d.locked ? d : { ...d, val: Math.floor(Math.random() * 8) + 1 });
        intervals++;
        UI.renderDice(battle, activeHighlight);

        if (intervals >= 15) { // increased animation duration
            clearInterval(timer);
            battle.dice.sort((a, b) => a.val - b.val);

            if (!isInitial && stage.activeShackle === 'forcedshift') {
                let lockedDice = battle.dice.filter(d => d.locked);
                if (lockedDice.length > 0) {
                    let target = lockedDice[Math.floor(Math.random() * lockedDice.length)];
                    target.val = Math.floor(Math.random() * 8) + 1;
                    battle.dice.sort((a, b) => a.val - b.val);
                    UI.showToast(`🌀 【強制轉換】發動：已鎖定骰子數值被改變！`);
                }
            }
            
            if (isInitial && stage.activeShackle === 'cursedlock' && stage.shackleMeta) {
                let minVal = Math.min(...battle.dice.map(d => d.val));
                let cursedDie = battle.dice.find(d => d.val === minVal);
                cursedDie.locked = true;
                stage.shackleMeta.cursedId = cursedDie.id;
            }

            let shackleConfig = null;
            if (stage.activeShackle) {
                shackleConfig = { id: stage.activeShackle };
                if (stage.shackleMeta) {
                    Object.assign(shackleConfig, stage.shackleMeta);
                }
            }

            let activeRelics = player.relics;
            if (stage.activeShackle === 'relicseal' && stage.shackleMeta && stage.shackleMeta.ignoredRelics) {
                activeRelics = player.relics.filter(r => !stage.shackleMeta.ignoredRelics.includes(r));
            }

            let isInitialRoll = (battle.rollsLeft === player.maxRolls);
            battle.scoreResult = calculateEngineScore(battle.dice, activeRelics, battle.rollsLeft, player.hp, shackleConfig, isInitialRoll, stage.turnsLeft);

            if (stage.activeShackle === 'blind' && stage.shackleMeta) {
                let unlockedIndices = battle.dice.map((d, i) => !d.locked ? i : -1).filter(i => i !== -1);
                unlockedIndices.sort(() => Math.random() - 0.5);
                stage.shackleMeta.blindIndices = unlockedIndices.slice(0, 2);
            }

            const applyMatch = (usedVals, groupName) => {
                if(!usedVals || usedVals.length === 0) return;
                let available = battle.dice.filter(d => !d.matchedGroups[groupName]);
                usedVals.forEach(v => {
                    let idx = available.findIndex(dice => dice.val === v);
                    if (idx !== -1) {
                        available[idx].matchedGroups[groupName] = true;
                        available.splice(idx, 1);
                    }
                });
            };

            applyMatch(battle.scoreResult.tagA.used, 'A');
            applyMatch(battle.scoreResult.tagB.used, 'B');
            applyMatch(battle.scoreResult.tagC.used, 'C');
            applyMatch(battle.scoreResult.tagD.used, 'D');

            battle.state = 'WAIT_ACTION';
            saveGame();
            renderAll();
        }
    }, 25);
};

window.fireAttack = function() {
    if (battle.state !== 'WAIT_ACTION') return;
    battle.state = 'ATTACKING';
    activeHighlight = null;
    
    if (stage.activeShackle === 'tremor' && Math.random() < 0.10) {
        let unlockedDice = battle.dice.filter(d => !d.locked);
        if (unlockedDice.length > 0) {
            let target = unlockedDice[Math.floor(Math.random() * unlockedDice.length)];
            target.val = Math.floor(Math.random() * 8) + 1;
            battle.dice.sort((a, b) => a.val - b.val);
            
            let shackleConfig = null;
            if (stage.activeShackle) {
                shackleConfig = { id: stage.activeShackle };
                if (stage.shackleMeta) Object.assign(shackleConfig, stage.shackleMeta);
            }

            let activeRelics = player.relics;
            if (stage.activeShackle === 'relicseal' && stage.shackleMeta && stage.shackleMeta.ignoredRelics) {
                activeRelics = player.relics.filter(r => !stage.shackleMeta.ignoredRelics.includes(r));
            }

            let isInitialRoll = (battle.rollsLeft === player.maxRolls);
            battle.scoreResult = calculateEngineScore(battle.dice, activeRelics, battle.rollsLeft, player.hp, shackleConfig, isInitialRoll, stage.turnsLeft);
            UI.showToast(`🖐️ 【手抖】發動：強制重骰了 1 顆未鎖定的骰子！`);
        }
    }
    
    // Render dice one last time to reveal 'blind' masked dice and any tremor changes
    UI.renderDice(battle, activeHighlight);
    
    UI.renderControls(battle);
    Audio.playAttackSound();

    let finalDamage = Math.floor(battle.scoreResult.finalScore);
    if (player.relics.includes('dragonslayer') && (stage.level % 5 === 4 || stage.level === ENEMY_DB.length - 1)) {
        finalDamage = Math.floor(finalDamage * 1.5);
        UI.showToast("🐉 【屠龍者】發動：對 Boss/菁英怪傷害 x1.5！");
    }
    let dmg = finalDamage;

    if (stage.activeShackle === 'absolutebarrier' && !stage.hasAttackedThisStage) {
        dmg = 0;
        stage.hasAttackedThisStage = true;
        UI.showToast("🛡️ 【絕對屏障】發動：第一次攻擊無效化！");
    } else {
        stage.hasAttackedThisStage = true;
    }

    if (stage.activeShackle === 'abyssgaze' && dmg > 0 && dmg < stage.enemyMaxHp * 0.20) {
        let healAmount = dmg;
        dmg = 0;
        stage.enemyHp = Math.min(stage.enemyMaxHp, stage.enemyHp + healAmount);
        UI.showToast(`👁️ 【深淵凝視】發動：傷害過低，轉為治療 Boss ${healAmount} HP！`);
    }

    let actualDamage = Math.min(dmg, stage.enemyHp);
    stage.enemyHp -= dmg;

    if (stage.activeShackle === 'healingdice') {
        let count1 = battle.dice.filter(d => d.val === 1).length;
        if (count1 > 0) {
            let healAmount = Math.floor(count1 * stage.enemyMaxHp * 0.05);
            stage.enemyHp = Math.min(stage.enemyMaxHp, stage.enemyHp + healAmount);
            UI.showToast(`💉 【治癒之骰】發動：敵人恢復 ${healAmount} HP！`);
        }
    }

    if (stage.activeShackle === 'wrath') {
        let multiA = battle.scoreResult.tagA.multi || 0;
        let multiB = battle.scoreResult.tagB.multi || 0;
        let multiC = battle.scoreResult.tagC.multi || 0;
        let multiD = battle.scoreResult.tagD.multi || 0;
        if (multiA >= 20 || multiB >= 20 || multiC >= 20 || multiD >= 20) {
            player.hp -= 1;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`⚡ 【天譴】發動：觸發高倍率牌型，強制扣除 1 HP！`);
        }
    }

    if (player.relics.includes('goldendice') && battle.dice) {
        let sevens = battle.dice.filter(d => d.val === 7).length;
        if (sevens > 0) {
            let goldEarned = sevens * 3;
            player.gold += goldEarned;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`💰 黃金骰子發動：獲得 ${goldEarned} 金幣！`);
        }
    }

    if (dmg > (player.highestDamage || 0)) {
        player.highestDamage = dmg;
        let combos = [];
        if (battle.scoreResult.tagA.name !== '無') { combos.push(battle.scoreResult.tagA.name); }
        if (battle.scoreResult.tagB.name !== '無') { combos.push(battle.scoreResult.tagB.name); }
        if (battle.scoreResult.tagC.name !== '無') { combos.push(battle.scoreResult.tagC.name); }
        if (battle.scoreResult.tagD.name !== '無') { combos.push(battle.scoreResult.tagD.name); }
        player.highestDamageCombo = combos.join(' + ') || '無';
    }
    
    // Always unlock hands regardless of highest damage
    if (battle.scoreResult.tagA.name !== '無') unlockCollectionItem('hand', battle.scoreResult.tagA.name);
    if (battle.scoreResult.tagB.name !== '無') unlockCollectionItem('hand', battle.scoreResult.tagB.name);
    if (battle.scoreResult.tagC.name !== '無') unlockCollectionItem('hand', battle.scoreResult.tagC.name);
    if (battle.scoreResult.tagD.name !== '無') unlockCollectionItem('hand', battle.scoreResult.tagD.name);

    UI.el.battleArea.classList.remove('shake-hard');
    void UI.el.battleArea.offsetWidth;
    UI.el.battleArea.classList.add('shake-hard');

    UI.el.hitFlash.classList.remove('hidden');
    UI.el.hitFlash.classList.remove('flash-red-anim');
    void UI.el.hitFlash.offsetWidth;
    UI.el.hitFlash.classList.add('flash-red-anim');

    let dmgEl = document.createElement('div');
    dmgEl.className = 'damage-text text-6xl md:text-8xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.9)] z-30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    dmgEl.innerText = `-${dmg.toLocaleString()}`;
    UI.el.damageContainer.appendChild(dmgEl);

    setTimeout(() => {
        dmgEl.remove();
        UI.el.hitFlash.classList.add('hidden');
    }, 1200);

    UI.updateEnemyUI(stage);

    setTimeout(() => {
        let isDefeated = stage.enemyHp <= 0;
        let playerDied = applyCombatShackles(dmg, actualDamage, isDefeated);
        
        if (player.hp <= 0) {
            playerTakesFatalDamage("血量耗盡，旅程結束！");
            if (player.hp <= 0) return;
        }
        if (playerDied) {
            playerTakesFatalDamage("受到反傷，血量耗盡！");
            if (player.hp <= 0) return;
        }

        if (isDefeated) {
            // 如果是最後一關，直接觸發勝利
            if (stage.level === ENEMY_DB.length - 1) {
                gameWin();
            } else {
                enemyDefeated();
            }
        }
        else {
            stage.turnsLeft--;
            if (stage.turnsLeft <= 0) {
                player.hp--;
                if (player.relics.includes('berserker')) {
                    player.berserkerBonus = (player.berserkerBonus || 0) + 1;
                    UI.showToast("💢 【越戰越勇】發動：永久增加 1 次重骰次數！");
                }
                if (player.hp <= 0) {
                    playerTakesFatalDamage("血量耗盡，旅程結束！");
                    if (player.hp <= 0) return;
                }
                else {
                    UI.showToast(`⚠️ 未在回合內擊殺！\n扣除 1 HP，重新挑戰！`, () => {
                        stage.turnsLeft = getEnemy(stage.level).turns;
                        if (stage.activeShackle === 'timecompress') stage.turnsLeft = 2;
                        startTurn();
                    });
                }
            } else startTurn();
        }
    }, 1000);
};

// --- 商店與關卡結算 ---
function enemyDefeated() {
    let isEliteOrBoss = (stage.level % 5 === 4 || stage.level === ENEMY_DB.length - 1);
    if (player.relics.includes('firstaid') && isEliteOrBoss && player.hp < 3) {
        player.hp++;
        UI.showToast("🚑 【急救包】發動：恢復 1 點 HP！");
    }

    if (stage.activeShackle === 'wither' && stage.shackleMeta && stage.shackleMeta.originalHp) {
        player.hp = stage.shackleMeta.originalHp;
    }

    if (stage.activeShackle === 'assimilation' && player.gold > 50) {
        player.gold = 0;
        UI.showToast("👽 【同化】發動：超過 50 金幣，金幣強制歸零！");
    }

    let baseEarn = 15;
    let turnsBonus = (stage.turnsLeft - 1) * 10;
    let extraEarn = 0;

    if (player.relics.includes('piggybank')) {
        extraEarn += 5;
        UI.showToast("🐷 【存錢筒】發動：獲得 5 枚金幣！");
    }

    let enemy = getEnemy(stage.level);
    if (player.relics.includes('bounty') && stage.turnsLeft === enemy.turns) {
        extraEarn += 20;
        UI.showToast("🎯 【賞金獵人】發動：1 回合內秒殺，額外獲得 20 金幣！");
    }

    if (stage.activeShackle === 'pickyeater') {
        baseEarn = Math.floor(baseEarn * 0.7);
        UI.showToast("🥦 【偏食】發動：基礎金幣獎勵減少 30%！");
    }

    let activeRelics = player.relics;
    if (stage.activeShackle === 'relicseal' && stage.shackleMeta && stage.shackleMeta.ignoredRelics) {
        activeRelics = player.relics.filter(r => !stage.shackleMeta.ignoredRelics.includes(r));
    }
    
    if (activeRelics.includes('coin')) extraEarn += 15;
    if (activeRelics.includes('investor')) extraEarn += Math.floor(player.gold / 10);
    
    let totalBaseEarn = baseEarn + extraEarn;
    let earn = totalBaseEarn + turnsBonus;
    player.gold += earn;
    UI.shootConfetti();

    let goldMessage = turnsBonus > 0 
        ? `💰 獲得 ${totalBaseEarn} 金幣 + ${turnsBonus} 金幣 (剩餘攻擊次數加成)！`
        : `💰 獲得 ${totalBaseEarn} 金幣！`;

    let availableForShop = RELIC_DB.filter(r => !player.relics.includes(r.id));
    let nextStep = availableForShop.length === 0 ? nextStage : openShop;

    if (stage.level === 2) {
        if (availableForShop.length > 0) {
            let randomRelic = availableForShop[Math.floor(Math.random() * availableForShop.length)];
            player.relics.push(randomRelic.id);
            unlockCollectionItem('relic', randomRelic.id);
            UI.showToast(`🎉 擊敗了菁英怪！\n${goldMessage}\n🎁 掉落遺物：${randomRelic.name}`, nextStep);
            return;
        }
    }

    let enemyName = getEnemy(stage.level).name;
    UI.showToast(`🎉 擊敗了 ${enemyName}！\n${goldMessage}`, nextStep);
}

function openShop() {
    UI.el.shopOverlay.classList.remove('hidden');
    UI.el.shopOverlay.classList.add('flex');
    shopRerollsUsed = 0;
    window.itemsBoughtThisScreen = 0;
    UI.updateShopRerollBtn(shopRerollsUsed);
    UI.el.shopGold.innerText = player.gold;
    UI.updateHeaderUI(player, stage);
    window.rerollShop(true);
}

window.rerollShop = function(isInitial = false) {
    if (!isInitial) {
        if (player.relics.includes('scavenger') && window.itemsBoughtThisScreen === 0) {
            player.gold += 3;
            UI.showToast("🗑️ 【拾荒者】發動：未購買任何物品，獲得 3 金幣！");
        }

        let cost = shopRerollsUsed === 0 ? 0 : 3;
        if (player.gold < cost) return UI.showToast("⚠️ 金幣不足！");
        player.gold -= cost;
        shopRerollsUsed++;
        UI.updateShopRerollBtn(shopRerollsUsed);
        UI.el.shopGold.innerText = player.gold;
        UI.updateHeaderUI(player, stage);
    }
    window.itemsBoughtThisScreen = 0;
    let available = RELIC_DB.filter(r => !player.relics.includes(r.id)).sort(() => 0.5 - Math.random()).slice(0, 3);
    shopItems = applyEconomyShackles(available);
    UI.renderShopItems(shopItems, player);
    saveGame();
};

window.buyItem = function(idx) {
    let r = shopItems[idx];
    if (player.gold >= r.price) {
        Audio.playBuySound();
        player.gold -= r.price;
        player.relics.push(r.id);
        window.itemsBoughtThisScreen++;
        unlockCollectionItem('relic', r.id);
        shopItems.splice(idx, 1);
        UI.el.shopGold.innerText = player.gold;
        // ★ 修復：同步更新頂部資訊列的金幣
        UI.updateHeaderUI(player, stage);
        UI.renderShopItems(shopItems, player);
        UI.renderInventory(player);
        saveGame();
    }
};

function nextStage() { loadStage(stage.level + 1); }

function recordHistory(win) {
    if (stage.shackleTimer) {
        clearTimeout(stage.shackleTimer);
        stage.shackleTimer = null;
    }
    let history = secureParseStorage(HISTORY_KEY, [], (data) => Array.isArray(data));
    let currentRecord = {
        win: win,
        isInfiniteMode: player.isInfiniteMode,
        infiniteLevel: player.isInfiniteMode ? (stage.level - ENEMY_DB.length + 1) : 0,
        stageName: getEnemy(stage.level).name,
        date: new Date().toISOString(),
        highestDamage: player.highestDamage || 0,
        combo: player.highestDamageCombo || '無',
        relics: [...player.relics]
    };
    history.push(currentRecord);
    // 只保留最近 20 筆紀錄
    if (history.length > 20) {
        history.shift();
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function gameOver(reason) {
    clearSave();
    recordHistory(false);
    UI.el.endOverlay.classList.remove('hidden');
    UI.el.endOverlay.classList.add('flex');
    UI.el.endTitle.className = "text-5xl md:text-7xl font-black text-red-500 mb-4 shake-hard";

    if (player.isInfiniteMode) {
        let infiniteLevel = stage.level - ENEMY_DB.length + 1;
        UI.el.endTitle.innerText = `無限塔第 ${infiniteLevel} 層 挑戰失敗`;
    } else {
        UI.el.endTitle.innerText = "GAME OVER";
    }

    UI.el.endDesc.innerText = reason;
    UI.renderEndGameStats(player.highestDamage, player.highestDamageCombo, player.relics);
}

function gameWin() {
    if (stage.activeShackle === 'wither' && stage.shackleMeta && stage.shackleMeta.originalHp) {
        player.hp = stage.shackleMeta.originalHp;
    }

    clearSave();
    recordHistory(true);
    UI.el.endOverlay.classList.remove('hidden');
    UI.el.endOverlay.classList.add('flex');

    let btnRestart = document.getElementById('btn-restart');
    let btnInfinite = document.getElementById('btn-infinite');

    if (btnRestart) btnRestart.classList.add('hidden');
    if (btnInfinite) btnInfinite.classList.remove('hidden');

    UI.el.endTitle.className = "text-5xl md:text-7xl font-black text-amber-400 mb-4 pop-anim";
    UI.el.endTitle.innerText = "🎉 遊戲通關 🎉";
    UI.el.endDesc.innerText = "你擊敗了創世神，證明了混亂中的絕對秩序！";
    UI.renderEndGameStats(player.highestDamage, player.highestDamageCombo, player.relics);
    let endInterval = setInterval(UI.shootConfetti, 1000);
    setTimeout(() => clearInterval(endInterval), 5000);
}

// 啟動遊戲
loadCollection();
initTitleScreen();
