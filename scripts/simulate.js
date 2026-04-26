import fs from 'fs';
import { ENEMY_DB, RELIC_DB, SHACKLE_DB, RULE_DB, FUSION_RECIPES } from '../js/data.js';
import { calculateEngineScore } from '../js/engine.js';

// --- Mocks for Node.js environment ---
global.window = {
    getCollection: () => ({ hands: {}, relics: [], shackles: [] }),
    getMaxHp: () => 3,
    getStageLevel: () => 0
};
global.document = { createElement: () => ({}) };

const NUM_SIMULATIONS = 100000;

// --- Mock Logic ---
function getEnemy(levelIndex) {
    if (levelIndex < ENEMY_DB.length) {
        return ENEMY_DB[levelIndex];
    } else {
        let infiniteLevel = levelIndex - ENEMY_DB.length + 1;
        let m = ((infiniteLevel - 1) % 3) + 1;
        let n = Math.floor((infiniteLevel - 1) / 3) + 1;

        let baseHp = ENEMY_DB[ENEMY_DB.length - 1].hp;
        let hp = Math.floor(baseHp * Math.pow(1.5, infiniteLevel));
        if (hp > Number.MAX_SAFE_INTEGER) hp = Number.MAX_SAFE_INTEGER;
        return { name: `Infinite ${infiniteLevel}`, hp: hp, turns: 3 };
    }
}

function assignShackleForStage(levelIndex) {
    let shackleType = null;
    if (levelIndex < ENEMY_DB.length) {
        if (levelIndex === 2 || levelIndex === 8) shackleType = 'light';
        else if (levelIndex === 5 || levelIndex === 9) shackleType = 'heavy';
    } else {
        let m = ((levelIndex - ENEMY_DB.length) % 3) + 1;
        shackleType = (m === 3) ? 'heavy' : 'light';
    }

    if (shackleType) {
        let candidates = SHACKLE_DB.filter(s => s.type === shackleType);
        let selected = candidates[Math.floor(Math.random() * candidates.length)];
        let meta = null;
        if (selected.id === 'parityfear') meta = { fearType: Math.random() > 0.5 ? 'odd' : 'even' };
        else if (selected.id === 'numberplunder') meta = { targetNumber: Math.floor(Math.random() * 8) + 1 };
        else if (selected.id === 'illusion') meta = { fakeNumber: Math.floor(Math.random() * 8) + 1 };
        return { ...selected, ...meta };
    }
    return null;
}

function rollDice(count) {
    let res = [];
    for(let i=0; i<count; i++) res.push({ val: Math.floor(Math.random() * 8) + 1, locked: false, id: i });
    return res;
}

async function run() {
    console.log(`Starting ${NUM_SIMULATIONS} simulations...`);

    // Output tracking
    let globalStats = {
        totalRuns: NUM_SIMULATIONS,
        stageReached: Array(15).fill(0), // 0 to 10+
        damageAtStage: { 0: [], 2: [], 5: [], 9: [] }, // 1, 3, 6, 10
        shackleDeaths: {},
        relicPicked: {},
        relicWin: {},
        handPlayed: {},
        handWin: {},
        highestInfinite: 0,
        sumInfinite: 0,
        infiniteRuns: 0,
        highestDamage: 0,
        sumRelics: 0,
        sumGold: 0 // Will be 0
    };

    for (let run = 0; run < NUM_SIMULATIONS; run++) {
        let player = { hp: 3, relics: [], maxRolls: 2 };
        let stage = { level: 0 };
        let isDead = false;
        let reachedInfinite = false;

        let runHands = new Set();

        while (!isDead) {
            let enemy = getEnemy(stage.level);
            let enemyHp = enemy.hp;
            let shackle = assignShackleForStage(stage.level);
            let activeShackles = shackle ? [shackle] : [];
            let turnsLeft = enemy.turns;

            global.window.getStageLevel = () => stage.level;

            // Combat Loop
            while (turnsLeft > 0 && enemyHp > 0 && !isDead) {
                let rollsLeft = player.maxRolls;
                let dice = rollDice(8);

                // Simple AI: roll once, keep nothing, roll again. Just random.
                if (rollsLeft > 0) {
                    dice = rollDice(8);
                }

                let env = { level: stage.level, relics: player.relics, unlockedHands: 5, playerHp: player.hp, maxHp: 3 };
                let score = calculateEngineScore(dice, player.relics, 0, player.hp, activeShackles, false, turnsLeft, env);

                let dmg = score.finalScore;
                if (dmg > globalStats.highestDamage) globalStats.highestDamage = dmg;

                if (stage.level === 0 || stage.level === 2 || stage.level === 5 || stage.level === 9) {
                    globalStats.damageAtStage[stage.level].push(dmg);
                }

                if (score.tagA.name !== '無') { runHands.add(score.tagA.name); globalStats.handPlayed[score.tagA.name] = (globalStats.handPlayed[score.tagA.name] || 0) + 1; }
                if (score.tagB.name !== '無') { runHands.add(score.tagB.name); globalStats.handPlayed[score.tagB.name] = (globalStats.handPlayed[score.tagB.name] || 0) + 1; }
                if (score.tagC.name !== '無') { runHands.add(score.tagC.name); globalStats.handPlayed[score.tagC.name] = (globalStats.handPlayed[score.tagC.name] || 0) + 1; }
                if (score.tagD.name !== '無') { runHands.add(score.tagD.name); globalStats.handPlayed[score.tagD.name] = (globalStats.handPlayed[score.tagD.name] || 0) + 1; }

                // Apply Ironwall shackle
                if (shackle && shackle.id === 'ironwall') dmg *= 0.8;
                if (shackle && shackle.id === 'gluttony') enemyHp += enemy.hp * 0.03;

                enemyHp -= dmg;

                if (enemyHp > 0) {
                    turnsLeft--;
                    if (turnsLeft === 0) {
                        player.hp--;
                        if (player.hp <= 0) {
                            isDead = true;
                            if (shackle) globalStats.shackleDeaths[shackle.id] = (globalStats.shackleDeaths[shackle.id] || 0) + 1;
                        } else {
                            turnsLeft = enemy.turns;
                        }
                    }
                }
            }

            if (isDead) break;

            // Enemy Defeated - Drop Elite/Boss Relic
            if ([2, 5, 8, 9].includes(stage.level)) {
                let drops = RELIC_DB.filter(r => !player.relics.includes(r.id) && r.rarity !== 5);
                if (drops.length > 0) {
                    let drop = drops[Math.floor(Math.random() * drops.length)];
                    player.relics.push(drop.id);
                }
            }

            // V6 Shop Logic (Pick 1 of 3, 1 Reroll)
            let shopPool = RELIC_DB.filter(r => !player.relics.includes(r.id) && r.rarity !== 5);
            // Filter fused materials
            let fusedMaterials = [];
            player.relics.forEach(rId => {
                if (FUSION_RECIPES[rId]) {
                    fusedMaterials.push(FUSION_RECIPES[rId].mat1);
                    fusedMaterials.push(FUSION_RECIPES[rId].mat2);
                }
            });
            shopPool = shopPool.filter(r => !fusedMaterials.includes(r.id));

            // Randomly decide to reroll 50% of the time to simulate the 1 free reroll
            if (Math.random() > 0.5) {
                shopPool.sort(() => 0.5 - Math.random());
            }
            shopPool.sort(() => 0.5 - Math.random());
            let shopItems = shopPool.slice(0, 3);

            if (shopItems.length > 0) {
                let picked = shopItems[Math.floor(Math.random() * shopItems.length)];
                player.relics.push(picked.id);
                globalStats.relicPicked[picked.id] = (globalStats.relicPicked[picked.id] || 0) + 1;
            }

            // Fusion Check
            let fusedAny = true;
            while (fusedAny) {
                fusedAny = false;
                for (let fid in FUSION_RECIPES) {
                    if (player.relics.includes(fid)) continue;
                    let rec = FUSION_RECIPES[fid];
                    if (player.relics.includes(rec.mat1) && player.relics.includes(rec.mat2)) {
                        player.relics = player.relics.filter(r => r !== rec.mat1 && r !== rec.mat2);
                        player.relics.push(fid);
                        fusedAny = true;
                        break;
                    }
                }
            }

            stage.level++;
            if (stage.level > 9) {
                reachedInfinite = true;
            }
        }

        // Track stats end of run
        let displayStage = Math.min(stage.level, 14);
        globalStats.stageReached[displayStage]++;
        if (reachedInfinite) {
            globalStats.infiniteRuns++;
            let infLvl = stage.level - 9;
            globalStats.sumInfinite += infLvl;
            if (infLvl > globalStats.highestInfinite) globalStats.highestInfinite = infLvl;
        }

        let relicCount = 0;
        player.relics.forEach(r => {
            let def = RELIC_DB.find(d => d.id === r);
            if (def && def.rarity === 5) relicCount += 2;
            else relicCount += 1;
        });
        globalStats.sumRelics += relicCount;

        if (stage.level >= 9) {
            runHands.forEach(h => { globalStats.handWin[h] = (globalStats.handWin[h] || 0) + 1; });
            player.relics.forEach(r => { globalStats.relicWin[r] = (globalStats.relicWin[r] || 0) + 1; });
        }
    }

    // Process output directly instead of saving massive dump array
    let output = `[V6 Simulation Report - ${NUM_SIMULATIONS} runs]\n`;
    output += `Stage Reached Distribution: ${JSON.stringify(globalStats.stageReached)}\n`;

    let avgDmg1 = globalStats.damageAtStage[0].reduce((a,b)=>a+b, 0) / Math.max(1, globalStats.damageAtStage[0].length);
    let avgDmg3 = globalStats.damageAtStage[2].reduce((a,b)=>a+b, 0) / Math.max(1, globalStats.damageAtStage[2].length);
    let avgDmg6 = globalStats.damageAtStage[5].reduce((a,b)=>a+b, 0) / Math.max(1, globalStats.damageAtStage[5].length);
    let avgDmg10 = globalStats.damageAtStage[9].reduce((a,b)=>a+b, 0) / Math.max(1, globalStats.damageAtStage[9].length);

    output += `Avg Damage - Stage 1: ${avgDmg1.toFixed(2)}, Stage 3: ${avgDmg3.toFixed(2)}, Stage 6: ${avgDmg6.toFixed(2)}, Stage 10: ${avgDmg10.toFixed(2)}\n`;

    let sortedRelics = Object.entries(globalStats.relicWin).sort((a,b)=>b[1]-a[1]);
    output += `Top 5 Relics by Win Count: ${JSON.stringify(sortedRelics.slice(0,5))}\n`;
    output += `Bottom 5 Relics by Win Count: ${JSON.stringify(sortedRelics.slice(-5))}\n`;

    let sortedHands = Object.entries(globalStats.handWin).sort((a,b)=>b[1]-a[1]);
    output += `Top 3 Hands by Win Count: ${JSON.stringify(sortedHands.slice(0,3))}\n`;

    let sortedShackles = Object.entries(globalStats.shackleDeaths).sort((a,b)=>b[1]-a[1]);
    output += `Highest Lethality Shackles: ${JSON.stringify(sortedShackles.slice(0,3))}\n`;
    output += `Lowest Lethality Shackles: ${JSON.stringify(sortedShackles.slice(-3))}\n`;

    let avgInf = globalStats.sumInfinite / Math.max(1, globalStats.infiniteRuns);
    output += `Infinite Mode Runs: ${globalStats.infiniteRuns}, Avg Inf Stage: ${avgInf.toFixed(2)}, Max Inf Stage: ${globalStats.highestInfinite}\n`;
    output += `Max Absolute Damage: ${globalStats.highestDamage}\n`;

    let avgRelics = globalStats.sumRelics / NUM_SIMULATIONS;
    output += `Avg Relics per Run (Fusion counts as 2): ${avgRelics.toFixed(2)}\n`;
    output += `Avg Gold: 0 (Gold mechanics removed in V6)\n`;

    fs.writeFileSync('V6_Simulation_Report.txt', output);
    console.log(output);
    console.log("Done.");
}

run().catch(console.error);
