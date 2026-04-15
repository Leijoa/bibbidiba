// js/main.js
import { RELIC_DB, ENEMY_DB } from './data.js';
import { calculateEngineScore } from './engine.js';
import * as UI from './ui.js';

// --- 遊戲狀態 ---
let player = { hp: 3, gold: 0, relics: [], maxRolls: 2 };
let stage = { level: 0, enemyMaxHp: 0, enemyHp: 0, turnsLeft: 0 };
let battle = { state: 'IDLE', dice: Array(8).fill().map((_, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} })), rollsLeft: 0, scoreResult: null };
let shopItems = [];
let shopRerollsUsed = 0;
let activeHighlight = null;
const SAVE_KEY = 'bibbidiba_save_v24';

// --- 存檔系統 (Save System) ---
function saveGame() {
    const saveData = { player, stage: { level: stage.level } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        player = parsed.player;
        UI.el.titleScreen.classList.add('hidden');
        loadStage(parsed.stage.level, true); // 讀取關卡並恢復血量
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
    
    // 綁定靜態按鈕事件
    UI.el.btnNewGame.onclick = () => {
        clearSave();
        UI.el.titleScreen.classList.add('hidden');
        initNewGame();
    };
    UI.el.btnContinue.onclick = () => loadGame();
    
    document.getElementById('btn-rules').onclick = () => UI.el.rulesModal.classList.remove('hidden');
    document.getElementById('btn-close-rules').onclick = () => UI.el.rulesModal.classList.add('hidden');
    
    UI.el.shopRerollBtn.onclick = () => window.rerollShop(false);
    document.getElementById('btn-next-stage').onclick = () => nextStage();
    document.getElementById('btn-restart').onclick = () => location.reload();
}

function initNewGame() {
    player = { hp: 3, gold: 20, relics: [], maxRolls: 2 };
    loadStage(0);
}

function loadStage(levelIndex, isLoad = false) {
    if (levelIndex >= ENEMY_DB.length) return gameWin();
    stage.level = levelIndex;
    let enemy = ENEMY_DB[levelIndex];
    stage.enemyMaxHp = enemy.hp;
    // 如果是讀檔，敵人血量回滿，重新挑戰該關卡
    stage.enemyHp = enemy.hp; 
    stage.turnsLeft = enemy.turns;
    UI.el.shopOverlay.classList.add('hidden');
    
    saveGame(); // 進關卡自動存檔
    renderAll();
    startTurn();
}

function startTurn() {
    if (stage.turnsLeft <= 0) return gameOver("回合耗盡，未能擊敗敵人！");
    battle.state = 'IDLE';
    activeHighlight = null;
    player.maxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2);
    battle.rollsLeft = player.maxRolls;
    battle.dice = battle.dice.map((d, i) => ({ val: 1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} }));
    battle.scoreResult = null;
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
    renderAll();

    let intervals = 0;
    let timer = setInterval(() => {
        battle.dice = battle.dice.map(d => d.locked ? d : { ...d, val: Math.floor(Math.random() * 8) + 1 });
        intervals++;
        UI.renderDice(battle, activeHighlight);

        if (intervals >= 10) {
            clearInterval(timer);
            battle.dice.sort((a, b) => a.val - b.val);
            
            // 呼叫獨立的引擎進行計算
            battle.scoreResult = calculateEngineScore(battle.dice, player.relics, battle.rollsLeft);
            
            // 將引擎計算出的 used 綁定回骰子的 UI 狀態
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
            renderAll();
        }
    }, 45);
};

window.fireAttack = function() {
    if (battle.state !== 'WAIT_ACTION') return;
    battle.state = 'ATTACKING';
    activeHighlight = null;
    UI.renderControls(battle);

    let dmg = Math.floor(battle.scoreResult.finalScore);
    stage.enemyHp -= dmg;

    // 觸發打擊震動與特效
    UI.el.battleArea.classList.remove('shake-hard');
    void UI.el.battleArea.offsetWidth;
    UI.el.battleArea.classList.add('shake-hard');

    UI.el.hitFlash.classList.remove('hidden');
    UI.el.hitFlash.classList.remove('flash-red-anim');
    void UI.el.hitFlash.offsetWidth;
    UI.el.hitFlash.classList.add('flash-red-anim');

    let dmgEl = document.createElement('div');
    dmgEl.className = 'damage-text text-5xl md:text-7xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.9)] z-30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    dmgEl.innerText = `-${dmg.toLocaleString()}`;
    UI.el.damageContainer.appendChild(dmgEl);

    setTimeout(() => {
        dmgEl.remove();
        UI.el.hitFlash.classList.add('hidden');
    }, 1200);

    UI.updateEnemyUI(stage);

    setTimeout(() => {
        if (stage.enemyHp <= 0) enemyDefeated();
        else {
            stage.turnsLeft--;
            if (stage.turnsLeft <= 0) {
                player.hp--;
                if (player.hp <= 0) gameOver("血量耗盡，旅程結束！");
                else {
                    UI.showToast(`⚠️ 未在回合內擊殺！\n扣除 1 HP，重新挑戰！`, () => {
                        stage.turnsLeft = ENEMY_DB[stage.level].turns;
                        startTurn();
                    });
                }
            } else startTurn();
        }
    }, 1000);
};

// --- 商店與關卡結算 ---
function enemyDefeated() {
    let earn = 15 + (stage.turnsLeft * 5) + (player.relics.includes('coin') ? 15 : 0);
    player.gold += earn;
    UI.shootConfetti();

    // 菁英怪(關卡3)必定掉落遺物
    if (stage.level === 2) {
        let available = RELIC_DB.filter(r => !player.relics.includes(r.id));
        if (available.length > 0) {
            let randomRelic = available[Math.floor(Math.random() * available.length)];
            player.relics.push(randomRelic.id);
            UI.showToast(`🎉 擊敗了菁英怪！\n💰 獲得 ${earn} 金幣！\n🎁 掉落遺物：${randomRelic.name}`, openShop);
            return;
        }
    }
    UI.showToast(`🎉 擊敗了 ${ENEMY_DB[stage.level].name}！\n💰 獲得 ${earn} 金幣！`, openShop);
}

function openShop() {
    UI.el.shopOverlay.classList.remove('hidden'); 
    UI.el.shopOverlay.classList.add('flex');
    shopRerollsUsed = 0;
    saveGame(); // 進商店前存檔
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
    }
    let available = RELIC_DB.filter(r => !player.relics.includes(r.id)).sort(() => 0.5 - Math.random()).slice(0, 3);
    shopItems = available;
    UI.renderShopItems(shopItems, player);
};

window.buyItem = function(idx) {
    let r = shopItems[idx];
    if (player.gold >= r.price) {
        player.gold -= r.price; 
        player.relics.push(r.id); 
        shopItems.splice(idx, 1);
        UI.el.shopGold.innerText = player.gold;
        UI.renderShopItems(shopItems, player);
        UI.renderInventory(player);
        saveGame(); // 買完東西即刻存檔
    }
};

function nextStage() { loadStage(stage.level + 1); }

function gameOver(reason) {
    clearSave(); // 死亡清空存檔
    UI.el.endOverlay.classList.remove('hidden'); 
    UI.el.endOverlay.classList.add('flex');
    UI.el.endTitle.className = "text-4xl md:text-6xl font-black text-red-500 mb-4 shake-hard";
    UI.el.endTitle.innerText = "GAME OVER";
    UI.el.endDesc.innerText = reason;
}

function gameWin() {
    clearSave(); // 通關清空存檔
    UI.el.endOverlay.classList.remove('hidden'); 
    UI.el.endOverlay.classList.add('flex');
    UI.el.endTitle.className = "text-4xl md:text-6xl font-black text-amber-400 mb-4";
    UI.el.endTitle.innerText = "🎉 遊戲通關 🎉";
    UI.el.endDesc.innerText = "你擊敗了創世神，證明了混亂中的絕對秩序！";
    let endInterval = setInterval(UI.shootConfetti, 1000);
    setTimeout(() => clearInterval(endInterval), 5000);
}

// 啟動遊戲
initTitleScreen();