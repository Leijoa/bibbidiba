import fs from 'fs';
import { RULE_DB, RELIC_DB, SHACKLE_DB, ENEMY_DB, getEnemy, FUSION_RECIPES } from '../js/data.js';
import { calculateEngineScore } from '../js/engine.js';

let stats = {
    totalRuns: 0,
    winCount: 0,
    lossCount: 0,
    handStats: {},       // { '手牌名': { triggered: 0, wins: 0 } }
    relicStats: {},      // { '遺物id': { equipped: 0, wins: 0 } }
    shackleDeath: {},    // { '枷鎖id': 0 }
    shackleEncounter: {}, // { '枷鎖id': 0 }
    stageDamage: {
        0: { total: 0, count: 0 },
        2: { total: 0, count: 0 },
        5: { total: 0, count: 0 },
        9: { total: 0, count: 0 }
    }
};

// Initialize structures
for (let key in RULE_DB) {
    RULE_DB[key].forEach(r => stats.handStats[r.name] = { triggered: 0, wins: 0 });
}
stats.handStats['無'] = { triggered: 0, wins: 0 };

RELIC_DB.forEach(r => stats.relicStats[r.id] = { equipped: 0, wins: 0 });
SHACKLE_DB.forEach(s => {
    stats.shackleDeath[s.id] = 0;
    stats.shackleEncounter[s.id] = 0;
});

// helper hooks from main.js approximated
function applyCombatShackles(dmg, actualDamage, isEnemyDefeated, stage, player) {
    if (!stage.activeShackle) return false;
    let playerDied = false;
    if (stage.activeShackle === 'vampire' && !isEnemyDefeated) {
        let lostGold = Math.min(5, player.gold);
        player.gold -= lostGold;
    }
    if (stage.activeShackle === 'thief' && !isEnemyDefeated) {
        let lostGold = Math.min(2, player.gold);
        player.gold -= lostGold;
    }
    if (stage.activeShackle === 'thornarmor') {
        let threshold = stage.enemyMaxHp * 0.10;
        if (dmg < threshold) {
            player.hp--;
            if (player.relics.includes('berserker')) player.berserkerBonus = (player.berserkerBonus || 0) + 1;
            if (player.hp <= 0) playerDied = true;
        }
    }
    if (stage.activeShackle === 'mutualdestruction') {
        let recoil = Math.floor(dmg * 0.05);
        if (recoil > 0) {
            player.hp -= recoil;
            if (player.hp <= 0) player.hp = 1; // 免疫致死
        }
    }
    return playerDied;
}

function assignShackleForStage(levelIndex) {
    let shackleType = null;
    if (levelIndex === 2) shackleType = 'light';
    else if (levelIndex === 5) shackleType = 'heavy';
    else if (levelIndex === 8) shackleType = 'light';
    else if (levelIndex === 9) shackleType = 'heavy';

    if (shackleType) {
        let candidates = SHACKLE_DB.filter(s => s.type === shackleType);
        let selected = candidates[Math.floor(Math.random() * candidates.length)];
        return { id: selected.id, meta: null }; // simplifications
    }
    return { id: null, meta: null };
}

function decideLocks(dice) {
    // Basic AI strategy: 'pairs' heavily
    let counts = Array(9).fill(0);
    dice.forEach(d => counts[d.val]++);

    let maxCount = 0;
    let targetVal = 1;
    for(let i=1; i<=8; i++) {
        if(counts[i] > maxCount) {
            maxCount = counts[i];
            targetVal = i;
        }
    }

    // AI logic: lock anything that matches targetVal
    return dice.map(d => ({ ...d, locked: d.val === targetVal }));
}

function checkRelicFusion(player) {
    let fusedAny = false;
    let recipesToProcess = Object.keys(FUSION_RECIPES);
    let keepChecking = true;
    while(keepChecking) {
        keepChecking = false;
        for (let i = 0; i < recipesToProcess.length; i++) {
            let fid = recipesToProcess[i];
            let rec = FUSION_RECIPES[fid];
            if (player.relics.includes(rec.mat1) && player.relics.includes(rec.mat2) && !player.relics.includes(fid)) {
                player.relics = player.relics.filter(r => r !== rec.mat1 && r !== rec.mat2);
                player.relics.push(fid);
                fusedAny = true;
                keepChecking = true;
                break;
            }
        }
    }
    return fusedAny;
}

function simulateShop(player) {
    // Simplistic shop: buy random affordable relics until broke
    let available = RELIC_DB.filter(r => !player.relics.includes(r.id)).sort(() => 0.5 - Math.random());
    for(let r of available) {
        let price = r.price;
        price = Math.max(1, price - (player.discountUpg * 2));
        if(player.relics.includes('vip')) price = Math.floor(price * 0.8);
        if(player.gold >= price) {
            player.gold -= price;
            player.relics.push(r.id);
            checkRelicFusion(player);
        }
    }
}

function autoPlayBattle(stage, player) {
    let enemy = getEnemy(stage.level);
    stage.enemyMaxHp = enemy.hp;
    stage.enemyHp = enemy.hp;
    stage.turnsLeft = enemy.turns;

    let sAssign = assignShackleForStage(stage.level);
    stage.activeShackle = sAssign.id;
    if(stage.activeShackle) {
        stats.shackleEncounter[stage.activeShackle]++;
    }

    if(stage.activeShackle === 'wither') player.hp = 1;
    if(stage.activeShackle === 'timecompress') stage.turnsLeft = 2;

    while(stage.enemyHp > 0 && player.hp > 0 && stage.turnsLeft > 0) {
        let maxRolls = 2 + player.rerollsUpg + (player.relics.filter(id => id === 'refresh').length * 2) + (player.berserkerBonus || 0);
        if(stage.activeShackle === 'fatigue') maxRolls = Math.max(0, maxRolls - 1);
        if(stage.activeShackle === 'destinychain') maxRolls = 1;

        let rollsLeft = maxRolls;
        let dice = Array(8).fill(0).map((_, i) => ({ id: i, val: Math.floor(Math.random() * 8) + 1, locked: false }));

        // Use AI lock & reroll
        while(rollsLeft > 0) {
            dice = decideLocks(dice);
            dice = dice.map(d => d.locked ? d : { ...d, val: Math.floor(Math.random() * 8) + 1 });
            rollsLeft--;
        }

        // Attack
        let isInitialRoll = maxRolls === rollsLeft; // if maxRolls === rollsLeft (0 rolls used)
        let env = { level: stage.level, gold: player.gold, totalGoldEarned: player.totalGoldEarned || player.gold, relics: player.relics, playerHp: player.hp };

        let result = calculateEngineScore(dice, player.relics, rollsLeft, player.hp, { id: stage.activeShackle }, isInitialRoll, stage.turnsLeft, env);

        // Store hands triggered
        let handsTriggered = [result.tagA.name, result.tagB.name, result.tagC.name, result.tagD.name].filter(n => n !== '無');
        if (!player.tempHands) player.tempHands = new Set();
        handsTriggered.forEach(h => player.tempHands.add(h));

        let dmg = Math.floor(result.finalScore);
        // apply economy / relic damage buffs
        if (player.relics.includes('fusion_miser')) dmg += Math.floor(dmg * (player.gold * 0.01));
        if (player.relics.includes('fusion_empire')) {
            let empireMulti = 1 + Math.floor((player.totalGoldEarned || player.gold) / 1000) * 0.2;
            if (empireMulti > 1) dmg = Math.floor(dmg * empireMulti);
        }
        if (player.relics.includes('dragonslayer') && [2, 5, 8, 9].includes(stage.level)) {
            dmg = Math.floor(dmg * 1.5);
        }
        dmg = Math.floor(dmg * player.maxMetaBuff);

        let actualDamage = Math.min(dmg, stage.enemyHp);
        stage.enemyHp -= dmg;

        if (stage.level === 0 || stage.level === 2 || stage.level === 5 || stage.level === 9) {
            stats.stageDamage[stage.level].total += dmg;
            stats.stageDamage[stage.level].count++;
        }

        // Post attack shackle impacts
        let isDefeated = stage.enemyHp <= 0;
        let diedFromRecoil = applyCombatShackles(dmg, actualDamage, isDefeated, stage, player);

        if (player.hp <= 0 || diedFromRecoil) {
            // Death checks
            if(player.relics.includes('bankrupt') && player.gold >= 100) {
                player.gold = 0; player.hp = 1;
                player.relics = player.relics.filter(r => r !== 'bankrupt');
            } else {
                player.hp = 0;
                break;
            }
        }

        if (!isDefeated) {
            stage.turnsLeft--;
            if(stage.turnsLeft <= 0) {
                player.hp--;
                if(player.relics.includes('bankrupt') && player.hp <= 0 && player.gold >= 100) {
                    player.gold = 0; player.hp = 1; player.relics = player.relics.filter(r => r !== 'bankrupt');
                    stage.turnsLeft = enemy.turns;
                }
            }
        }
    }
}

function runSimulation() {
    const TOTAL_RUNS = 100000;

    for(let i=0; i<TOTAL_RUNS; i++) {
        stats.totalRuns++;
        let player = { hp: 3, gold: 20, relics: [], totalGoldEarned: 20, maxMetaBuff: 1.0, startRelic: false, rerollsUpg: 0, discountUpg: 0 };

        let stage = { level: 0 };

        let won = false;

        for(let lv=0; lv<10; lv++) {
            stage.level = lv;
            autoPlayBattle(stage, player);

            if(player.hp <= 0) {
                stats.lossCount++;
                if(stage.activeShackle) stats.shackleDeath[stage.activeShackle]++;
                break;
            }

            // Stage Cleared
            let baseEarn = 10 + (stage.level * 2);
            if([2, 5, 8, 9].includes(stage.level)) baseEarn += 15;
            player.gold += baseEarn;
            player.totalGoldEarned += baseEarn;

            if([2, 5, 8].includes(stage.level)) {
                let av = RELIC_DB.filter(r => !player.relics.includes(r.id));
                if(av.length > 0) {
                    player.relics.push(av[Math.floor(Math.random()*av.length)].id);
                    checkRelicFusion(player);
                }
            }

            simulateShop(player);

            if (lv === 9) won = true;
        }

        if (won) stats.winCount++;

        // Log final player states
        if (player.tempHands) {
            player.tempHands.forEach(h => {
                if(stats.handStats[h]) {
                    stats.handStats[h].triggered++;
                    if(won) stats.handStats[h].wins++;
                }
            });
        }
        player.relics.forEach(r => {
            if(stats.relicStats[r]) {
                stats.relicStats[r].equipped++;
                if(won) stats.relicStats[r].wins++;
            }
        });

        if (i % 10000 === 0) console.log(`Progress: ${i} / ${TOTAL_RUNS}`);
    }

    generateReport();
}


function generateReport() {
    let report = `V5 Version 100,000 Runs Simulation Report\n`;
    report += `==========================================\n`;
    report += `Total Runs: ${stats.totalRuns}\n`;
    report += `Win Rate: ${((stats.winCount / stats.totalRuns) * 100).toFixed(2)}%\n`;

    report += `\n[特定關卡平均傷害]\n`;
    [0, 2, 5, 9].forEach(lv => {
        let sd = stats.stageDamage[lv];
        let avg = sd.count > 0 ? (sd.total / sd.count) : 0;
        report += `- 第 ${lv + 1} 關: 平均傷害 ${Math.floor(avg).toLocaleString()}\n`;
    });

    // Sort hands
    let hands = Object.keys(stats.handStats).map(k => ({ name: k, ...stats.handStats[k] })).filter(h => h.triggered > 0);
    hands.forEach(h => h.winRate = h.wins / h.triggered);
    hands.sort((a,b) => b.winRate - a.winRate);

    report += `\n[Top 5 強勢牌型 (依勝率)]\n`;
    hands.slice(0, 5).forEach(h => report += `- ${h.name}: ${h.triggered} 次觸發, 勝率 ${(h.winRate*100).toFixed(2)}%\n`);

    report += `\n[Top 5 弱勢牌型 (依勝率)]\n`;
    hands.slice(-5).reverse().forEach(h => report += `- ${h.name}: ${h.triggered} 次觸發, 勝率 ${(h.winRate*100).toFixed(2)}%\n`);

    // Sort relics
    let relics = Object.keys(stats.relicStats).map(k => { let rObj = RELIC_DB.find(x=>x && x.id===k); return { id: k, name: rObj ? rObj.name : k, ...stats.relicStats[k] }; }).filter(r => r.equipped > 0);
    relics.forEach(r => r.winRate = r.wins / r.equipped);
    relics.sort((a,b) => b.winRate - a.winRate);

    report += `\n[Top 5 強勢遺物 (依勝率)]\n`;
    relics.slice(0, 5).forEach(r => report += `- ${r.name}: 裝備 ${r.equipped} 次, 勝率 ${(r.winRate*100).toFixed(2)}%\n`);

    report += `\n[Top 5 弱勢遺物 (依勝率)]\n`;
    relics.slice(-5).reverse().forEach(r => report += `- ${r.name}: 裝備 ${r.equipped} 次, 勝率 ${(r.winRate*100).toFixed(2)}%\n`);

    // Sort shackles
    let shackleData = Object.keys(stats.shackleDeath).map(k => ({
        name: SHACKLE_DB.find(x=>x.id===k)?.name || k,
        encounters: stats.shackleEncounter[k],
        deaths: stats.shackleDeath[k],
        deathRate: stats.shackleEncounter[k] > 0 ? stats.shackleDeath[k] / stats.shackleEncounter[k] : 0
    })).filter(s => s.encounters > 0);
    shackleData.sort((a,b) => b.deathRate - a.deathRate);

    report += `\n[枷鎖致死率最高 (前 5)]\n`;
    shackleData.slice(0, 5).forEach(s => report += `- ${s.name}: ${s.encounters} 次遭遇, 致死 ${s.deaths} 次, 致死率 ${(s.deathRate*100).toFixed(2)}%\n`);

    report += `\n[枷鎖致死率最低 (前 5)]\n`;
    shackleData.slice(-5).reverse().forEach(s => report += `- ${s.name}: ${s.encounters} 次遭遇, 致死 ${s.deaths} 次, 致死率 ${(s.deathRate*100).toFixed(2)}%\n`);

    fs.writeFileSync('V5_Simulation_Report.txt', report, 'utf8');
    console.log("Simulation complete! Report saved to V5_Simulation_Report.txt");
}

runSimulation();
