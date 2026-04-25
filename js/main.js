// js/main.js
import { RELIC_DB, ENEMY_DB, RULE_DB, getEnemy, FUSION_RECIPES, CONSUMABLES_DB } from './data.js';
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
const SAVE_KEY = 'bibbidiba_save_v50';
const HISTORY_KEY = 'bibbidiba_history_v50';
const COLLECTION_KEY = 'bibbidiba_collection_v50';

const META_KEY = 'bibbidiba_meta_v1';
let metaData = {
    souls: 0,
    upgrades: {
        hp: 0,         // 等級 0~2 (+1 最大生命)
        discount: 0,   // 等級 0~3 (-2 商店金幣)
        startGold: 0,  // 等級 0~3 (+10 初始金幣)
        rerolls: 0,    // 等級 0~2 (+1 初始重骰)
        startRelic: 0, // 等級 0~1 (+1 初始遺物)
        finalDamage: 0 // 等級 0~5 (+10% 最終傷害)
    }
};

function loadMetaData() {
    metaData = secureParseStorage(META_KEY, metaData, (data) => typeof data.souls === 'number');
}
function saveMetaData() {
    localStorage.setItem(META_KEY, JSON.stringify(metaData));
}

window.getMetaData = () => metaData;
window.saveMetaData = saveMetaData;


// 開發者模式
let devSecretBuffer = "";
window.addEventListener('keydown', (e) => {
    devSecretBuffer += e.key;
    if (devSecretBuffer.length > 7) devSecretBuffer = devSecretBuffer.slice(-7);
    if (devSecretBuffer === "3345678") {
        triggerDevMode();
    }
});

function triggerDevMode() {
    // 增加金幣
    player.gold += 99999;
    UI.updateHeaderUI(player, stage);
    if (UI.el.shopGold) UI.el.shopGold.innerText = player.gold;

    // 增加靈魂
    metaData.souls += 1000;
    saveMetaData();

    // 如果在標題畫面，全開收集冊
    if (!UI.el.titleScreen.classList.contains('hidden')) {
        for (let group in RULE_DB) RULE_DB[group].forEach(r => { if (!collection.hands.includes(r.id)) collection.hands.push(r.id); });
        RELIC_DB.forEach(r => { if (!collection.relics.includes(r.id)) collection.relics.push(r.id); });
        import('./data.js').then(({ SHACKLE_DB }) => {
            SHACKLE_DB.forEach(r => { if (!collection.shackles.includes(r.id)) collection.shackles.push(r.id); });
            saveCollection();
        });
        UI.showToast("🛠️ 【開發者模式】已獲得 99,999 金幣、1000 靈魂，並全開收集冊！");
    } else {
        UI.showToast("🛠️ 【開發者模式】已獲得 99,999 金幣與 1000 靈魂！");
    }

    if (window.openDevModal) {
        window.openDevModal();
    }
}

if (UI.el.devRelicConfirm) {
    UI.el.devRelicConfirm.onclick = () => {
        let select = UI.el.devRelicSelect;
        if (!select || !select.value) {
            UI.showToast("請選擇一個遺物！");
            return;
        }
        let rId = select.value;
        player.relics.push(rId);
        unlockCollectionItem('relic', rId);

        // 為了使用 checkRelicFusion 與 renderInventory 我們直接呼叫
        if (typeof checkRelicFusion === 'function') checkRelicFusion();
        UI.renderInventory(player, battle);
        if (typeof saveGame === 'function') saveGame();

        UI.showToast(`🛠️ 已獲得遺物：${rId}`);
        window.closeDevModal();
    };
}

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

window.saveCollection = saveCollection;
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
window.getStageLevel = () => stage.level;
window.getMaxHp = () => 3 + (metaData.upgrades.hp * 1);
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

    if (stage.activeShackle === 'mutualdestruction') {
        let recoil = Math.floor(dmg * 0.05);
        if (recoil > 0) {
            player.hp -= recoil;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`💥 【同歸於盡】發動：受到 ${recoil} 點反傷！`);
            if (player.hp <= 0) {
                player.hp = 1;
                UI.updateHeaderUI(player, stage);
                UI.showToast(`💥 【同歸於盡】發動：血量只剩 1，免於致死反彈！`);
            }
        }
    }

    return playerDied;
}

function applyEconomyShackles(items) {
    let result = items;
    let discount = metaData.upgrades.discount * 2;
    result = result.map(item => ({
        ...item,
        price: Math.max(1, item.price - discount)
    }));

    if (stage.activeShackle === 'inflation') {
        result = result.map(item => ({
            ...item,
            price: Math.ceil(item.price * 1.2)
        }));
    }
    if (player.relics.includes('fusion_recycle')) {
        result = result.map(item => ({
            ...item,
            price: Math.floor(item.price * 0.7)
        }));
    } else if (player.relics.includes('vip')) {
        result = result.map(item => ({
            ...item,
            price: Math.floor(item.price * 0.9)
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
            shackleMeta: stage.shackleMeta,
            hasAttackedThisStage: stage.hasAttackedThisStage
        },
        battle: {
            state: battle.state,
            dice: battle.dice,
            rollsLeft: battle.rollsLeft,
            scoreResult: battle.scoreResult,
            balanceUsedThisTurn: battle.balanceUsedThisTurn
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
            UI.updateShopRerollBtn(shopRerollsUsed, player.relics.includes('scavenger'), player.relics.includes('fusion_recycle'));
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
    loadMetaData();
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

        if (UI.el.btnSouls) {
        UI.el.btnSouls.onclick = () => {
            UI.renderSoulsModal(metaData);
            UI.el.soulsModal.classList.remove('hidden');
        };
        UI.el.btnCloseSouls.onclick = () => UI.el.soulsModal.classList.add('hidden');
    }

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
    let startHp = 3 + (metaData.upgrades.hp * 1);
    let startGold = 20 + (metaData.upgrades.startGold * 10);
    let startRerolls = 2 + (metaData.upgrades.rerolls * 1);

    player = {
        hp: startHp,
        gold: startGold,
        relics: [],
        maxRolls: startRerolls,
        highestDamage: 0,
        highestDamageCombo: '',
        isInfiniteMode: false, bonusBasePoints: 0, nextDamageMulti: 1.0
    };

    if (metaData.upgrades.startRelic > 0) {
        let available = RELIC_DB.filter(r => r.price > 0 && r.rarity === 1); // Give a basic relic
        if(available.length > 0) {
            let r = available[Math.floor(Math.random() * available.length)];
            player.relics.push(r.id);
            unlockCollectionItem('relic', r.id);
        }
    }

    loadStage(0);
}

function assignShackleForStage(levelIndex) {
    let shackleType = null;
    if (levelIndex < ENEMY_DB.length) {
        if (levelIndex === 2) shackleType = 'light';
        else if (levelIndex === 5) shackleType = 'heavy';
        else if (levelIndex === 8) shackleType = 'light';
        else if (levelIndex === 9) shackleType = 'heavy';
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
        stage.hasAttackedThisStage = parsedData.stage.hasAttackedThisStage || false;

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
            battle.balanceUsedThisTurn = parsedData.battle.balanceUsedThisTurn || false;
        }
    } else {
        stage.enemyHp = enemy.hp;
        stage.turnsLeft = enemy.turns;
        stage.hasAttackedThisStage = false;
        
        let shackleAssignment = assignShackleForStage(levelIndex);
        stage.activeShackle = shackleAssignment.id;
        stage.shackleMeta = shackleAssignment.meta;
        
        // Setup consumables buff for this stage
        stage.damageBuffMulti = player.nextDamageMulti || 1.0;
        player.nextDamageMulti = 1.0; // Consume it


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
        let healAmount = Math.floor(stage.enemyMaxHp * 0.03);
        if (stage.enemyHp < stage.enemyMaxHp) {
            stage.enemyHp = Math.min(stage.enemyMaxHp, stage.enemyHp + healAmount);
            UI.updateEnemyUI(stage);
            UI.showToast(`🍖 【貪吃】發動：敵人恢復 ${healAmount} HP！`);
        }
    }
    
    let baseMaxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2) + (player.berserkerBonus || 0);
    if (stage.activeShackle === 'fatigue') {
        baseMaxRolls = Math.max(0, baseMaxRolls - 1);
    }
    if (stage.activeShackle === 'destinychain') {
        baseMaxRolls = 1;
    }
    
    player.maxRolls = baseMaxRolls;
    battle.rollsLeft = player.maxRolls;
    battle.balanceUsedThisTurn = false;
    battle.dice = battle.dice.map((d, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} }));
    battle.scoreResult = null;
    saveGame();
    renderAll();
    window.executeRoll(true);
}

function renderAll() {
    UI.updateHeaderUI(player, stage);
    UI.updateEnemyUI(stage);
    UI.renderInventory(player, battle);
    UI.renderDice(battle, activeHighlight, player);
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

        if (willLock && stage.activeShackle === 'hardcap') {
            let currentLocks = battle.dice.filter(d => d.locked).length;
            if (currentLocks >= 4) {
                const diceEl = document.getElementById(`dice-element-${idx}`);
                if(diceEl) {
                    diceEl.classList.remove('shake-hard');
                    void diceEl.offsetWidth;
                    diceEl.classList.add('shake-hard');
                }
                return UI.showToast("🔒 【上限鎖死】最多只能鎖定 4 顆骰子！");
            }
        }
        
        if (willLock && stage.activeShackle === 'rusty') {
            let currentLocks = battle.dice.filter(d => d.locked).length;
            if (currentLocks >= 6) {
                const diceEl = document.getElementById(`dice-element-${idx}`);
                if(diceEl) {
                    diceEl.classList.remove('shake-hard');
                    void diceEl.offsetWidth;
                    diceEl.classList.add('shake-hard');
                }
                return UI.showToast("🔒 【生鏽的鎖】最多只能鎖定 6 顆骰子！");
            }
        }

        battle.dice[idx].locked = willLock;
        
        if (stage.activeShackle === 'dizziness' && stage.shackleMeta && stage.shackleMeta.displayOrder) {
            stage.shackleMeta.displayOrder.sort(() => Math.random() - 0.5);
        }
        
        saveGame();
        UI.renderDice(battle, activeHighlight, player);
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
    UI.renderDice(battle, activeHighlight, player);
    UI.renderScore(battle, activeHighlight);
};

window.executeRoll = function(isInitial = false) {
    if (!isInitial && battle.rollsLeft <= 0) return;
    if (battle.state === 'ROLLING' || battle.state === 'ATTACKING') return;

    if (!isInitial) {
        if (stage.activeShackle === 'sticky') {
            let lockedCount = battle.dice.filter(d => d.locked).length;
            let cost = lockedCount * 1;
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
                if (d.locked && Math.random() < 0.15) {
                    d.locked = false;
                    freed++;
                }
            });
            if (freed > 0) UI.showToast(`😡 【叛逆】發動：${freed} 顆骰子掙脫鎖定！`);
        }
        
        if (player.relics.includes('balance') && battle.rollsLeft === player.maxRolls && !battle.balanceUsedThisTurn) {
            UI.showToast("⚖️ 【動態平衡】發動：首次重骰不消耗次數！");
            battle.balanceUsedThisTurn = true;
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
        UI.renderDice(battle, activeHighlight, player);

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
            battle.scoreResult = calculateEngineScore(battle.dice, activeRelics, battle.rollsLeft, player.hp, shackleConfig ? [shackleConfig] : [], isInitialRoll, stage.turnsLeft, { level: stage.level, gold: player.gold, totalGoldEarned: player.totalGoldEarned || 0, relics: player.relics, unlockedHands: Object.keys(window.getCollection ? window.getCollection().hands : {}).length, playerHp: player.hp, maxHp: window.getMaxHp() });

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
            battle.scoreResult = calculateEngineScore(battle.dice, activeRelics, battle.rollsLeft, player.hp, shackleConfig ? [shackleConfig] : [], isInitialRoll, stage.turnsLeft, { level: stage.level, gold: player.gold, totalGoldEarned: player.totalGoldEarned || 0, relics: player.relics, unlockedHands: Object.keys(window.getCollection ? window.getCollection().hands : {}).length, playerHp: player.hp, maxHp: window.getMaxHp() });
            UI.showToast(`🖐️ 【手抖】發動：強制重骰了 1 顆未鎖定的骰子！`);
        }
    }
    
    // Render dice one last time to reveal 'blind' masked dice and any tremor changes
    UI.renderDice(battle, activeHighlight, player);
    
    UI.renderControls(battle);
    Audio.playAttackSound();

    let finalDamage = Math.floor(battle.scoreResult.finalScore);

    if (player.relics.includes('fusion_miser')) {
        finalDamage += Math.floor(finalDamage * (player.gold * 0.01));
        UI.showToast("💎 【黃金守財奴】複利增傷發動！");
    }

    if (player.relics.includes('fusion_empire')) {
        let totalGold = player.totalGoldEarned || player.gold;
        let empireMulti = 1 + Math.floor(totalGold / 1000) * 0.2;
        if (empireMulti > 1) {
            finalDamage = Math.floor(finalDamage * empireMulti);
            UI.showToast(`🏛️ 【帝國遺產】發動：傷害 x${empireMulti.toFixed(1)}！`);
        }
    }

    if (player.relics.includes('dragonslayer') && [2, 5, 8, 9].includes(stage.level)) {
        finalDamage = Math.floor(Math.min(Number.MAX_SAFE_INTEGER, finalDamage * 1.5));
        UI.showToast("🐉 【屠龍者】發動：對 Boss/菁英怪傷害 x1.5！");
    }

    // Meta-progression final damage buff
    if (metaData && metaData.upgrades && metaData.upgrades.finalDamage > 0) {
        let buffMulti = 1.0 + (metaData.upgrades.finalDamage * 0.1);
        finalDamage = Math.floor(Math.min(Number.MAX_SAFE_INTEGER, finalDamage * buffMulti));
    }

    if (stage.damageBuffMulti > 1.0) {
        finalDamage = Math.floor(Math.min(Number.MAX_SAFE_INTEGER, finalDamage * stage.damageBuffMulti));
        UI.showToast(`💪 力量藥劑發動：總傷害 x${stage.damageBuffMulti}！`);
    }

    let dmg = finalDamage;

    if (stage.activeShackle === 'ironwall') {
        dmg = Math.floor(dmg * 0.8);
        UI.showToast("🛡️ 【鐵壁】發動：最終傷害減少 20%！");
    }

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
        let count2 = battle.dice.filter(d => d.val === 2).length;
        if (count2 > 0) {
            let healAmount = Math.floor(count2 * stage.enemyMaxHp * 0.03);
            stage.enemyHp = Math.min(stage.enemyMaxHp, stage.enemyHp + healAmount);
            UI.showToast(`💉 【治癒之骰】發動：敵人恢復 ${healAmount} HP！`);
        }
    }

    if (stage.activeShackle === 'wrath') {
        let hasLegendary = false;
        ['tagA', 'tagB', 'tagC', 'tagD'].forEach(tag => {
            let name = battle.scoreResult[tag].name;
            if (name !== '無') {
                for (let group in RULE_DB) {
                    let rule = RULE_DB[group].find(r => r.name === name);
                    if (rule && rule.rarity === 4) hasLegendary = true;
                }
            }
        });
        if (hasLegendary) {
            player.hp -= 1;
            UI.updateHeaderUI(player, stage);
            UI.showToast(`⚡ 【天譴】發動：觸發傳說牌型，強制扣除 1 HP！`);
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

    // doVisuals: Immediately apply hit visual effects
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

    // hitstop delay
    let delay = dmg > stage.enemyMaxHp * 0.20 ? 100 : 0;

    setTimeout(() => {
        let isDefeated = stage.enemyHp <= 0;
        let playerDied = applyCombatShackles(dmg, actualDamage, isDefeated);
        
        // 統一依據當下的真實 HP 進行一次性判定
        if (player.hp <= 0) {
            // 根據 playerDied 來決定死因文字
            let deathReason = playerDied ? "受到反傷，血量耗盡！" : "血量耗盡，旅程結束！";
            playerTakesFatalDamage(deathReason);

            // 如果經過急救（破財消災）後 HP 仍然 <= 0，才中斷後續邏輯
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
                    // IF we are here, playerTakesFatalDamage rescued the player (hp is now 1)
                    UI.showToast(`⚠️ 未在回合內擊殺！\n破財消災發動，重新挑戰！`, () => {
                        stage.turnsLeft = getEnemy(stage.level).turns;
                        if (stage.activeShackle === 'timecompress') stage.turnsLeft = 2;
                        startTurn();
                    });
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
    }, 1000 + delay);
};

// --- 商店與關卡結算 ---

function checkRelicFusion() {
    let fusedAny = false;
    let recipesToProcess = Object.keys(FUSION_RECIPES);

    // Check multiple times in case one fusion satisfies another (rare, but good practice)
    let keepChecking = true;
    while(keepChecking) {
        keepChecking = false;
        for (let i = 0; i < recipesToProcess.length; i++) {
            let fid = recipesToProcess[i];
            let rec = FUSION_RECIPES[fid];

            // Check if player has BOTH materials and DOES NOT have the fused relic yet
            if (player.relics.includes(rec.mat1) && player.relics.includes(rec.mat2) && !player.relics.includes(fid)) {
                // Remove materials
                player.relics = player.relics.filter(r => r !== rec.mat1 && r !== rec.mat2);

                // Add fusion relic
                player.relics.push(fid);
                unlockCollectionItem('relic', fid);

                let relicDef = RELIC_DB.find(x => x.id === fid);
                UI.showToast(`✨ 遺物共鳴！\n【${RELIC_DB.find(x=>x.id===rec.mat1).name}】與【${RELIC_DB.find(x=>x.id===rec.mat2).name}】\n融合成了 ${relicDef.name}！`);

                fusedAny = true;
                keepChecking = true;
                break; // Restart loop to handle potential state changes safely
            }
        }
    }

    if (fusedAny) {
        UI.renderInventory(player, battle);
        if (!UI.el.shopOverlay.classList.contains('hidden')) {
            UI.renderShopItems(shopItems, player);
        }
    }
}

function enemyDefeated() {
    let isEliteOrBossFirstAid = [2, 5, 8, 9].includes(stage.level);
    if (player.relics.includes('firstaid') && isEliteOrBossFirstAid && player.hp < window.getMaxHp()) {
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

    let baseEarn = 20 + (stage.level * 5);
    let isEliteOrBossReward = [2, 5, 8, 9].includes(stage.level);
    if (isEliteOrBossReward) {
        baseEarn += 40; // 額外獲得 40 金幣懸賞
    }
    let turnsBonus = (stage.turnsLeft - 1) * 10;
    let extraEarn = 0;

    if (player.relics.includes('piggybank')) {
        extraEarn += 5;
        UI.showToast("🐷 【存錢筒】發動：獲得 5 枚金幣！");
    }

    let enemy = getEnemy(stage.level);
    if (player.relics.includes('bounty') && stage.turnsLeft === enemy.turns) {
        extraEarn += 10;
        UI.showToast("🎯 【賞金獵人】發動：1 回合內秒殺，額外獲得 10 金幣！");
    }

    if (stage.activeShackle === 'pickyeater') {
        baseEarn = Math.floor(baseEarn * 0.7);
        UI.showToast("🥦 【偏食】發動：基礎金幣獎勵減少 30%！");
    }

    let activeRelics = player.relics;
    if (stage.activeShackle === 'relicseal' && stage.shackleMeta && stage.shackleMeta.ignoredRelics) {
        activeRelics = player.relics.filter(r => !stage.shackleMeta.ignoredRelics.includes(r));
    }
    
    if (activeRelics.includes('coin')) extraEarn += 10;
    if (activeRelics.includes('investor')) extraEarn += Math.floor(player.gold / 10);
    
    let totalBaseEarn = baseEarn + extraEarn;
    let earn = totalBaseEarn + turnsBonus;
    player.gold += earn;
    player.totalGoldEarned = (player.totalGoldEarned || 0) + earn;
    UI.shootConfetti();

    let goldMessage = turnsBonus > 0 
        ? `💰 獲得 ${totalBaseEarn} 金幣 + ${turnsBonus} 金幣 (剩餘攻擊次數加成)！`
        : `💰 獲得 ${totalBaseEarn} 金幣！`;

    // Exclude Rarity 5 from regular drops
    let availableForShop = RELIC_DB.filter(r => !player.relics.includes(r.id) && r.rarity !== 5);
    let nextStep = (availableForShop.length === 0 && !player.isInfiniteMode) ? nextStage : openShop;

    // Boss (9) or Elite (2, 5, 8)
    let isEliteOrBossDrop = [2, 5, 8, 9].includes(stage.level);

    if (isEliteOrBossDrop && availableForShop.length > 0) {
        let randomRelic = availableForShop[Math.floor(Math.random() * availableForShop.length)];
        player.relics.push(randomRelic.id);
        unlockCollectionItem('relic', randomRelic.id);

        // Ensure UI updates properly if fusion happens
        checkRelicFusion();

        availableForShop = RELIC_DB.filter(r => !player.relics.includes(r.id) && r.rarity !== 5);
        nextStep = (availableForShop.length === 0 && !player.isInfiniteMode) ? nextStage : openShop;

        if (stage.level === 9 && !player.isInfiniteMode) {
            nextStep = gameWin; // End game normally instead of shopping after boss in standard mode
        }

        // Handle Souls
        let enemyName = getEnemy(stage.level).name;
        let earnedSouls = stage.level === 9 ? 2 : 1;
        if (player.isInfiniteMode || stage.level >= ENEMY_DB.length) earnedSouls = 1;

        metaData.souls += earnedSouls;
        saveMetaData();
        let soulMsg = `\n👻 獲得 ${earnedSouls} 個靈魂！`;

        if (stage.level === 9) {
            UI.showToast(`👑 擊敗了 ${enemyName}！\n${goldMessage}${soulMsg}\n🎁 掉落遺物：${randomRelic.name}`, nextStep);
        } else {
            UI.showToast(`🎉 擊敗了菁英怪！\n${goldMessage}${soulMsg}\n🎁 掉落遺物：${randomRelic.name}`, nextStep);
        }
    } else {
        let enemyName = getEnemy(stage.level).name;
        let earnedSouls = 0;
        if (stage.level === 9) earnedSouls = 2;
        else if (player.isInfiniteMode || stage.level >= ENEMY_DB.length) earnedSouls = 1;

        if (stage.level === 9 && !player.isInfiniteMode) {
            nextStep = gameWin;
        }

        let soulMsg = '';
        if (earnedSouls > 0) {
            metaData.souls += earnedSouls;
            saveMetaData();
            soulMsg = `\n👻 獲得 ${earnedSouls} 個靈魂！`;
        }
        UI.showToast(`🎉 擊敗了 ${enemyName}！\n${goldMessage}${soulMsg}`, nextStep);
    }
}

function openShop() {
    UI.el.shopOverlay.classList.remove('hidden');
    UI.el.shopOverlay.classList.add('flex');
    shopRerollsUsed = 0;
    window.itemsBoughtThisScreen = 0;
    UI.updateShopRerollBtn(shopRerollsUsed, player.relics.includes('scavenger'), player.relics.includes('fusion_recycle'));
    UI.el.shopGold.innerText = player.gold;
    UI.updateHeaderUI(player, stage);
    window.rerollShop(true);
}

window.rerollShop = function(isInitial = false) {
    let hasScavenger = player.relics.includes('scavenger');
    if (!isInitial) {
        let cost = 0;
        if (shopRerollsUsed > 0) {
            cost = 3 + (shopRerollsUsed - 1);
            if (player.relics.includes('fusion_recycle')) {
                cost = Math.max(1, cost - 3);
            } else if (hasScavenger) {
                cost = Math.max(1, cost - 2);
            }
        }
        
        if (player.gold < cost) return UI.showToast("⚠️ 金幣不足！");
        player.gold -= cost;
        shopRerollsUsed++;
        UI.updateShopRerollBtn(shopRerollsUsed, hasScavenger, player.relics.includes('fusion_recycle'));
        UI.el.shopGold.innerText = player.gold;
        UI.updateHeaderUI(player, stage);
    }
    window.itemsBoughtThisScreen = 0;

    // Remember currently displayed items to prevent them from showing up again
    let currentItemIds = shopItems ? shopItems.map(item => item.id) : [];

    let available = RELIC_DB.filter(r => !player.relics.includes(r.id) && r.rarity !== 5);

    // Track materials used in fusions to prevent them from showing up again
    let fusedMaterials = [];
    if (player.relics) {
        player.relics.forEach(rId => {
            if (FUSION_RECIPES[rId]) {
                fusedMaterials.push(FUSION_RECIPES[rId].mat1);
                fusedMaterials.push(FUSION_RECIPES[rId].mat2);
            }
        });
    }

    // Filter out fused materials unconditionally so they never show up
    available = available.filter(r => !fusedMaterials.includes(r.id));

    // Try to filter out current items if we have enough alternatives
    let nonDuplicateAvailable = available.filter(r => !currentItemIds.includes(r.id));
    if (nonDuplicateAvailable.length >= 3 || nonDuplicateAvailable.length > available.length / 2) {
        available = nonDuplicateAvailable;
    }

    available.sort(() => 0.5 - Math.random());
    let selectedItems = available.slice(0, 3);

    // If empty or infinite mode, inject consumables
    if (selectedItems.length < 3 || player.isInfiniteMode) {
        let cons = [...CONSUMABLES_DB];
        let nonDuplicateCons = cons.filter(c => !currentItemIds.includes(c.id));
        if (nonDuplicateCons.length >= (3 - selectedItems.length)) {
            cons = nonDuplicateCons;
        }
        cons.sort(() => 0.5 - Math.random());

        while(selectedItems.length < 3 && cons.length > 0) {
            selectedItems.push(cons.pop());
        }
    }

    shopItems = applyEconomyShackles(selectedItems);
    UI.renderShopItems(shopItems, player);
    saveGame();
};

window.showFusionInfo = function(fusionId) {
    let relic = RELIC_DB.find(r => r.id === fusionId);
    if (relic) {
        UI.showToast(`✨ 融合預覽：【${relic.name}】\n${relic.desc}`);
    }
};

window.buyItem = function(idx) {
    let r = shopItems[idx];
    if (player.gold >= r.price) {
        Audio.playBuySound();
        player.gold -= r.price;
        window.itemsBoughtThisScreen++;

        if (r.id.startsWith('cons_')) {
            // Consumable logic
            if (r.id === 'cons_power') {
                player.nextDamageMulti = (player.nextDamageMulti || 1.0) * 1.5;
                UI.showToast("💪 【力量藥劑】使用成功！下場戰鬥傷害提升！");
            } else if (r.id === 'cons_potential') {
                player.bonusBasePoints = (player.bonusBasePoints || 0) + 50;
                UI.showToast("🔥 【潛能秘藥】使用成功！永久基礎點數 +50！");
            } else if (r.id === 'cons_hp') {
                player.hp = Math.min(window.getMaxHp(), player.hp + 1);
                UI.showToast("❤️ 【生命紅藥】使用成功！回復 1 HP！");
            }
        } else {
            // Relic logic
            player.relics.push(r.id);
            unlockCollectionItem('relic', r.id);
            checkRelicFusion();
        }

        shopItems.splice(idx, 1);
        UI.el.shopGold.innerText = player.gold;
        // ★ 修復：同步更新頂部資訊列的金幣
        UI.updateHeaderUI(player, stage);
        UI.renderShopItems(shopItems, player);
        UI.renderInventory(player, battle);
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


function playerTakesFatalDamage(reason) {
    if (player.relics.includes('bankrupt') && player.gold >= 100) {
        player.gold = 0;
        player.hp = 1;
        player.relics = player.relics.filter(r => r !== 'bankrupt');
        UI.updateHeaderUI(player, stage);
        UI.showToast("🛡️ 【破財消災】發動：扣除所有金幣並保留 1 HP！（遺物已消耗）");
        return;
    }
    gameOver(reason);
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
