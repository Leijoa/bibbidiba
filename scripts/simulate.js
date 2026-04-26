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

    // Track total damage dealt in EXACTLY 3 turns for every stage (0 to 9)
    let stageTotalDamage = Array(10).fill().map(() => []);

    for (let run = 0; run < NUM_SIMULATIONS; run++) {
        let player = { hp: 3, relics: [], maxRolls: 3 };
        let stage = { level: 0 };

        // Only run exactly 10 stages (0 to 9)
        while (stage.level < 10) {
            let enemy = getEnemy(stage.level);
            let shackle = assignShackleForStage(stage.level);
            let activeShackles = shackle ? [shackle] : [];
            let turnsLeft = enemy.turns; // usually 3

            global.window.getStageLevel = () => stage.level;

            let totalDamageThisStage = 0;

            // Combat Loop: Force exactly 3 attacks
            while (turnsLeft > 0) {
                let rollsLeft = player.maxRolls;
                let dice = rollDice(8);

                // Simple AI: roll once, keep nothing, roll again.
                if (rollsLeft > 0) {
                    dice = rollDice(8);
                }

                let env = { level: stage.level, relics: player.relics, unlockedHands: 5, playerHp: player.hp, maxHp: 3 };
                let score = calculateEngineScore(dice, player.relics, 0, player.hp, activeShackles, false, turnsLeft, env);

                let dmg = score.finalScore;
                if (shackle && shackle.id === 'ironwall') dmg *= 0.8;

                totalDamageThisStage += dmg;
                turnsLeft--;
            }

            stageTotalDamage[stage.level].push(totalDamageThisStage);


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
        }
    }

    let output = `[V6 Target HP Recommendation - ${NUM_SIMULATIONS} runs]\n`;
    output += `Goal: To achieve ~20% pass rate, HP should be around the 80th Percentile (Top 20%) of 3-turn total damage.\n\n`;

    for (let i = 0; i < 10; i++) {
        let dmgArr = stageTotalDamage[i];
        dmgArr.sort((a, b) => a - b);

        let p50 = dmgArr[Math.floor(dmgArr.length * 0.5)];
        let p80 = dmgArr[Math.floor(dmgArr.length * 0.8)];
        let p90 = dmgArr[Math.floor(dmgArr.length * 0.9)];
        let avg = dmgArr.reduce((a,b) => a+b, 0) / dmgArr.length;

        output += `Stage ${i+1}:\n`;
        output += `  Average 3-Turn Dmg: ${Math.floor(avg).toLocaleString()}\n`;
        output += `  Median (50%) Dmg:   ${Math.floor(p50).toLocaleString()}\n`;
        output += `  Top 20% (80%) Dmg:  ${Math.floor(p80).toLocaleString()}  <-- Recommended HP\n`;
        output += `  Top 10% (90%) Dmg:  ${Math.floor(p90).toLocaleString()}\n\n`;
    }

    fs.writeFileSync('HP_Recommendation_Report.txt', output);
    console.log(output);
    console.log("Done.");
}

run().catch(console.error);
