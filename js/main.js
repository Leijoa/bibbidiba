// js/main.js
import { RELIC_DB, ENEMY_DB } from './data.js';
import { calculateEngineScore } from './engine.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';

// --- 遊戲狀態 ---
let player = { hp: 3, gold: 0, relics: [], maxRolls: 2 };
let stage = { level: 0, enemyMaxHp: 0, enemyHp: 0, turnsLeft: 0 };
let battle = { state: 'IDLE', dice: Array(8).fill().map((_, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} })), rollsLeft: 0, scoreResult: null };
let shopItems = [];
let shopRerollsUsed = 0;
let activeHighlight = null;
const SAVE_KEY = 'bibbidiba_save_v30';
const HISTORY_KEY = 'bibbidiba_history_v30';

// --- 存檔系統 (Save System) ---
function saveGame() {
    let inShop = !UI.el.shopOverlay.classList.contains('hidden');
    const saveData = {
        player,
        stage: {
            level: stage.level,
            enemyMaxHp: stage.enemyMaxHp,
            enemyHp: stage.enemyHp,
            turnsLeft: stage.turnsLeft
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
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        player = parsed.player;
        UI.el.titleScreen.classList.add('hidden');

        if (parsed.shop && parsed.shop.active) {
            stage.level = parsed.stage.level;
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
            let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            UI.renderHistoryModal(history);
            UI.el.historyModal.classList.remove('hidden');
        };
        UI.el.btnCloseHistory.onclick = () => UI.el.historyModal.classList.add('hidden');
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

function initNewGame() {
    player = { hp: 3, gold: 20, relics: [], maxRolls: 2, highestDamage: 0, highestDamageCombo: '', isInfiniteMode: false };
    loadStage(0);
}

function getEnemy(levelIndex) {
    if (levelIndex < ENEMY_DB.length) {
        return ENEMY_DB[levelIndex];
    } else {
        let baseHp = ENEMY_DB[ENEMY_DB.length - 1].hp;
        let infiniteLevel = levelIndex - ENEMY_DB.length + 1;
        let hp = Math.floor(baseHp * Math.pow(1.5, infiniteLevel));
        return { name: `無限塔第 ${infiniteLevel} 層`, hp: hp, turns: 5 };
    }
}

function loadStage(levelIndex, isLoad = false, parsedData = null) {
    if (levelIndex >= ENEMY_DB.length && !player.isInfiniteMode) return gameWin();
    stage.level = levelIndex;
    let enemy = getEnemy(levelIndex);
    stage.enemyMaxHp = enemy.hp;

    if (isLoad && parsedData && parsedData.stage) {
        stage.enemyHp = parsedData.stage.enemyHp ?? enemy.hp;
        stage.turnsLeft = parsedData.stage.turnsLeft ?? enemy.turns;

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
    player.maxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2);
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
        battle.dice[idx].locked = !battle.dice[idx].locked;
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

    if (!isInitial) battle.rollsLeft--;
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

        if (intervals >= 25) { // increased animation duration
            clearInterval(timer);
            battle.dice.sort((a, b) => a.val - b.val);

            battle.scoreResult = calculateEngineScore(battle.dice, player.relics, battle.rollsLeft, player.hp);

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
    }, 45);
};

window.fireAttack = function() {
    if (battle.state !== 'WAIT_ACTION') return;
    battle.state = 'ATTACKING';
    activeHighlight = null;
    UI.renderControls(battle);
    Audio.playAttackSound();

    let dmg = Math.floor(battle.scoreResult.finalScore);
    stage.enemyHp -= dmg;

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
        if (battle.scoreResult.tagA.name !== '無') combos.push(battle.scoreResult.tagA.name);
        if (battle.scoreResult.tagB.name !== '無') combos.push(battle.scoreResult.tagB.name);
        if (battle.scoreResult.tagC.name !== '無') combos.push(battle.scoreResult.tagC.name);
        if (battle.scoreResult.tagD.name !== '無') combos.push(battle.scoreResult.tagD.name);
        player.highestDamageCombo = combos.join(' + ') || '無';
    }

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
        if (stage.enemyHp <= 0) {
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
                if (player.hp <= 0) gameOver("血量耗盡，旅程結束！");
                else {
                    UI.showToast(`⚠️ 未在回合內擊殺！\n扣除 1 HP，重新挑戰！`, () => {
                        stage.turnsLeft = getEnemy(stage.level).turns;
                        startTurn();
                    });
                }
            } else startTurn();
        }
    }, 1000);
};

// --- 商店與關卡結算 ---
function enemyDefeated() {
    let baseEarn = 15;
    let turnsBonus = (stage.turnsLeft - 1) * 10;
    let extraEarn = 0;
    
    if (player.relics.includes('coin')) extraEarn += 15;
    if (player.relics.includes('investor')) extraEarn += Math.floor(player.gold / 10);
    
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
    UI.updateShopRerollBtn(shopRerollsUsed);
    UI.el.shopGold.innerText = player.gold;
    UI.updateHeaderUI(player, stage);
    window.rerollShop(true);
}

window.rerollShop = function(isInitial = false) {
    if (!isInitial) {
        let cost = shopRerollsUsed === 0 ? 0 : 3;
        if (player.gold < cost) return UI.showToast("⚠️ 金幣不足！");
        player.gold -= cost;
        shopRerollsUsed++;
        UI.updateShopRerollBtn(shopRerollsUsed);
        UI.el.shopGold.innerText = player.gold;
        // ★ 修復：同步更新頂部資訊列的金幣
        UI.updateHeaderUI(player, stage);
    }
    let available = RELIC_DB.filter(r => !player.relics.includes(r.id)).sort(() => 0.5 - Math.random()).slice(0, 3);
    shopItems = available;
    UI.renderShopItems(shopItems, player);
    saveGame();
};

window.buyItem = function(idx) {
    let r = shopItems[idx];
    if (player.gold >= r.price) {
        Audio.playBuySound();
        player.gold -= r.price;
        player.relics.push(r.id);
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
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    let currentRecord = {
        win: win,
        isInfiniteMode: player.isInfiniteMode,
        infiniteLevel: player.isInfiniteMode ? (stage.level - ENEMY_DB.length + 1) : 0,
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
initTitleScreen();
