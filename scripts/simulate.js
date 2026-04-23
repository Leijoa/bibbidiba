import fs from 'fs';
import { calculateEngineScore } from '../js/engine.js';
import { RELIC_DB, ENEMY_DB, SHACKLE_DB, getEnemy } from '../js/data.js';

function assignShackleForStage(levelIndex, playerRelics) {
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
        } else if (selected.id === 'cursedlock') {
            meta = { cursedId: null };
        } else if (selected.id === 'relicseal') {
            let shuffled = [...playerRelics].sort(() => 0.5 - Math.random());
            meta = { ignoredRelics: shuffled.slice(0, 2) };
        }

        return { id: selected.id, meta: meta };
    }
    return { id: null, meta: null };
}

class GameSimulation {
    constructor() {
        this.player = { hp: 3, gold: 20, relics: [], maxRolls: 2, isInfiniteMode: false };
        this.stage = { level: 0, enemyHp: 0, enemyMaxHp: 0, turnsLeft: 0, activeShackle: null, shackleMeta: null };
        this.battle = { dice: [], rollsLeft: 0, scoreResult: null, balanceUsedThisTurn: false };
        this.metrics = {
            win: false,
            shacklesDiedTo: null,
            relicsPicked: [],
            handsTriggered: {}
        };
    }

    run() {
        try {
            while (this.player.hp > 0) {
                // To win we just need to beat base game
                if (this.stage.level > 4) {
                    this.metrics.win = true;
                    break;
                }
                this.loadStage(this.stage.level);
                let result = this.playStage();
                if (result === 'playerDied') {
                    break;
                } else if (result === 'win') {
                    if (this.stage.level >= ENEMY_DB.length - 1) {
                        this.metrics.win = true;
                        break;
                    }
                    this.enemyDefeated();
                    this.stage.level++;
                }
            }
        } catch (e) {
            return { error: true, message: e.message, stack: e.stack, ...this.metrics };
        }
        this.metrics.relicsPicked = this.player.relics;
        return this.metrics;
    }

    loadStage(levelIndex) {
        let enemy = getEnemy(levelIndex);
        this.stage.enemyMaxHp = enemy.hp;
        this.stage.enemyHp = enemy.hp;
        this.stage.turnsLeft = enemy.turns;

        let shackleAssign = assignShackleForStage(levelIndex, this.player.relics);
        this.stage.activeShackle = shackleAssign.id;
        this.stage.shackleMeta = shackleAssign.meta;

        if (this.stage.activeShackle === 'timecompress') {
            this.stage.turnsLeft = 2;
        }
        if (this.stage.activeShackle === 'wither') {
            this.stage.shackleMeta = this.stage.shackleMeta || {};
            this.stage.shackleMeta.originalHp = this.player.hp;
            this.player.hp = 1;
        }
    }

    playStage() {
        let turnLimit = 15;
        while (this.stage.enemyHp > 0 && this.stage.turnsLeft > 0 && this.player.hp > 0 && turnLimit > 0) {
            turnLimit--;
            this.startTurn();
            this.performRolls();
            this.fireAttack();

            if (this.player.hp <= 0) return 'playerDied';
            if (this.stage.enemyHp <= 0) return 'win';

            this.stage.turnsLeft--;
            if (this.stage.turnsLeft <= 0) {
                this.player.hp--;
                if (this.player.relics.includes('berserker')) {
                    this.player.berserkerBonus = (this.player.berserkerBonus || 0) + 1;
                }
                if (this.player.hp <= 0) {
                    if (this.stage.activeShackle) this.metrics.shacklesDiedTo = this.stage.activeShackle;
                    return 'playerDied';
                } else {
                    let enemy = getEnemy(this.stage.level);
                    this.stage.turnsLeft = this.stage.activeShackle === 'timecompress' ? 2 : enemy.turns;
                }
            }
        }
        if (turnLimit <= 0) this.player.hp = 0;
        if (this.player.hp <= 0 && this.stage.activeShackle) this.metrics.shacklesDiedTo = this.stage.activeShackle;
        return this.player.hp > 0 ? 'win' : 'playerDied';
    }

    startTurn() {
        if (this.stage.activeShackle === 'gluttony') {
            let healAmount = Math.floor(this.stage.enemyMaxHp * 0.03);
            this.stage.enemyHp = Math.min(this.stage.enemyMaxHp, this.stage.enemyHp + healAmount);
        }

        let baseMaxRolls = 2 + (this.player.relics.filter(id => id === 'refresh').length * 2) + (this.player.berserkerBonus || 0);
        if (this.stage.activeShackle === 'fatigue') {
            baseMaxRolls = Math.max(0, baseMaxRolls - 1);
        }
        if (this.stage.activeShackle === 'destinychain') {
            baseMaxRolls = 1;
        }

        this.player.maxRolls = baseMaxRolls;
        this.battle.rollsLeft = this.player.maxRolls;
        this.battle.balanceUsedThisTurn = false;
        this.battle.dice = Array(8).fill().map((_, i) => ({ val: 1, locked: false, id: i }));
        this.executeRoll(true);
    }

    executeRoll(isInitial = false) {
        if (!isInitial) {
            if (this.player.relics.includes('piggybank')) {
                if (this.player.gold >= 1) this.player.gold -= 1;
                else return false;
            }
            if (this.stage.activeShackle === 'sticky') {
                let lockedCount = this.battle.dice.filter(d => d.locked).length;
                let cost = lockedCount * 1;
                if (cost > 0) {
                    if (this.player.gold >= cost) this.player.gold -= cost;
                    else return false;
                }
            }
            if (this.stage.activeShackle === 'greedy') {
                if (this.player.gold >= 2) this.player.gold -= 2;
                else return false;
            }

            if (this.stage.activeShackle === 'rebel') {
                this.battle.dice.forEach(d => {
                    if (d.locked && Math.random() < 0.15) d.locked = false;
                });
            }

            if (this.player.relics.includes('balance') && this.battle.rollsLeft === this.player.maxRolls && !this.battle.balanceUsedThisTurn) {
                this.battle.balanceUsedThisTurn = true;
            } else {
                this.battle.rollsLeft--;
            }
        }

        this.battle.dice = this.battle.dice.map(d => d.locked ? d : { ...d, val: Math.floor(Math.random() * 8) + 1 });
        this.battle.dice.sort((a, b) => a.val - b.val);

        if (!isInitial && this.stage.activeShackle === 'forcedshift') {
            let lockedDice = this.battle.dice.filter(d => d.locked);
            if (lockedDice.length > 0) {
                let target = lockedDice[Math.floor(Math.random() * lockedDice.length)];
                target.val = Math.floor(Math.random() * 8) + 1;
                this.battle.dice.sort((a, b) => a.val - b.val);
            }
        }

        if (isInitial && this.stage.activeShackle === 'cursedlock' && this.stage.shackleMeta) {
            let minVal = Math.min(...this.battle.dice.map(d => d.val));
            let cursedDie = this.battle.dice.find(d => d.val === minVal);
            if(cursedDie) {
                cursedDie.locked = true;
                this.stage.shackleMeta.cursedId = cursedDie.id;
            }
        }

        this.calculateCurrentScore(isInitial);
        return true;
    }

    calculateCurrentScore(isInitialRoll) {
        let shackleConfig = null;
        if (this.stage.activeShackle) {
            shackleConfig = { id: this.stage.activeShackle };
            if (this.stage.shackleMeta) {
                Object.assign(shackleConfig, this.stage.shackleMeta);
            }
        }

        let activeRelics = this.player.relics;
        if (this.stage.activeShackle === 'relicseal' && this.stage.shackleMeta && this.stage.shackleMeta.ignoredRelics) {
            activeRelics = this.player.relics.filter(r => !this.stage.shackleMeta.ignoredRelics.includes(r));
        }

        this.battle.scoreResult = calculateEngineScore(
            this.battle.dice,
            activeRelics,
            this.battle.rollsLeft,
            this.player.hp,
            shackleConfig,
            isInitialRoll,
            this.stage.turnsLeft
        );
    }

    performRolls() {
        while (this.battle.rollsLeft > 0) {
            this.aiLockLogic();
            let success = this.executeRoll(false);
            if (!success) break;
        }
    }

    aiLockLogic() {
        if (this.stage.activeShackle === 'fragile') return;

        let counts = Array(9).fill(0);
        this.battle.dice.forEach(d => counts[d.val]++);

        this.battle.dice.forEach(d => {
            let willLock = false;

            if (counts[d.val] >= 2) {
                willLock = true;
            } else if (d.val >= 6) { // Lock 6, 7, 8
                willLock = true;
            }

            if (this.stage.activeShackle === 'ultimatelock' && [2, 3, 4, 5].includes(d.id)) {
                willLock = false;
            }

            if (this.stage.activeShackle === 'sticky' && willLock && !d.locked) {
                if (this.player.gold < 10) willLock = false;
            }

            if (this.stage.activeShackle === 'cursedlock' && this.stage.shackleMeta && d.id === this.stage.shackleMeta.cursedId) {
                willLock = true;
            }

            d.locked = willLock;
        });

        // Enforce hardcap lock limit
        if (this.stage.activeShackle === 'hardcap') {
            let currentlyLocked = 0;
            this.battle.dice.forEach(d => {
                if (d.locked) {
                    currentlyLocked++;
                    if (currentlyLocked > 4) d.locked = false;
                }
            });
        }
        // Enforce rusty lock limit
        if (this.stage.activeShackle === 'rusty') {
            let currentlyLocked = 0;
            this.battle.dice.forEach(d => {
                if (d.locked) {
                    currentlyLocked++;
                    if (currentlyLocked > 6) d.locked = false;
                }
            });
        }
    }

    fireAttack() {
        if (this.stage.activeShackle === 'tremor' && Math.random() < 0.10) {
            let unlockedDice = this.battle.dice.filter(d => !d.locked);
            if (unlockedDice.length > 0) {
                let target = unlockedDice[Math.floor(Math.random() * unlockedDice.length)];
                target.val = Math.floor(Math.random() * 8) + 1;
                this.battle.dice.sort((a, b) => a.val - b.val);
                this.calculateCurrentScore(this.battle.rollsLeft === this.player.maxRolls);
            }
        }

        let finalDamage = Math.floor(this.battle.scoreResult.finalScore);
        if (this.player.relics.includes('dragonslayer') && (this.stage.level % 5 === 4 || this.stage.level === ENEMY_DB.length - 1)) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }
        let dmg = finalDamage;

        if (this.stage.activeShackle === 'ironwall') {
            dmg = Math.floor(dmg * 0.8);
        }

        if (this.stage.activeShackle === 'absolutebarrier' && !this.stage.hasAttackedThisStage) {
            dmg = 0;
            this.stage.hasAttackedThisStage = true;
        } else {
            this.stage.hasAttackedThisStage = true;
        }

        if (this.stage.activeShackle === 'abyssgaze' && dmg > 0 && dmg < this.stage.enemyMaxHp * 0.20) {
            let healAmount = dmg;
            dmg = 0;
            this.stage.enemyHp = Math.min(this.stage.enemyMaxHp, this.stage.enemyHp + healAmount);
        }

        this.stage.enemyHp -= dmg;

        let tags = ['tagA', 'tagB', 'tagC', 'tagD'];
        tags.forEach(t => {
            let name = this.battle.scoreResult[t].name;
            if (name !== '無') {
                if (!this.metrics.handsTriggered[name]) {
                    this.metrics.handsTriggered[name] = { count: 0, totalDamage: 0 };
                }
                this.metrics.handsTriggered[name].count++;
                this.metrics.handsTriggered[name].totalDamage += dmg;
            }
        });

        if (this.stage.activeShackle === 'healingdice') {
            let count1 = this.battle.dice.filter(d => d.val === 2).length;
            if (count1 > 0) {
                let healAmount = Math.floor(count1 * this.stage.enemyMaxHp * 0.03);
                this.stage.enemyHp = Math.min(this.stage.enemyMaxHp, this.stage.enemyHp + healAmount);
            }
        }

        if (this.stage.activeShackle === 'wrath') {
            let r = this.battle.scoreResult;
            if ((r.tagA.multi||0) >= 20 || (r.tagB.multi||0) >= 20 || (r.tagC.multi||0) >= 20 || (r.tagD.multi||0) >= 20) {
                this.player.hp -= 1;
            }
        }

        if (this.player.relics.includes('goldendice')) {
            let sevens = this.battle.dice.filter(d => d.val === 7).length;
            if (sevens > 0) {
                let goldEarned = sevens * 3;
                this.player.gold += goldEarned;
            }
        }

        let isEnemyDefeated = this.stage.enemyHp <= 0;
        if (this.stage.activeShackle === 'vampire' && !isEnemyDefeated) {
            let lost = Math.min(5, this.player.gold);
            this.player.gold -= lost;
        }
        if (this.stage.activeShackle === 'thief' && !isEnemyDefeated) {
            let lost = Math.min(2, this.player.gold);
            this.player.gold -= lost;
        }
        if (this.stage.activeShackle === 'thornarmor') {
            let threshold = this.stage.enemyMaxHp * 0.10;
            if (dmg < threshold) {
                this.player.hp--;
                if (this.player.relics.includes('berserker')) {
                    this.player.berserkerBonus = (this.player.berserkerBonus || 0) + 1;
                }
            }
        }
        if (this.stage.activeShackle === 'mutualdestruction') {
            let recoil = Math.floor(dmg * 0.05);
            if (recoil > 0) {
                this.player.hp -= recoil;
                if (this.player.hp <= 0) {
                    if (this.player.relics.includes('bankrupt') && this.player.gold >= 100) {
                        this.player.gold = 0;
                        this.player.hp = 1;
                        this.player.relics = this.player.relics.filter(r => r !== 'bankrupt');
                    } else {
                        this.player.hp = 1; // Basic mutual destruction prevents fatal
                    }
                }
            }
        }

        return dmg;
    }

    enemyDefeated() {
        let isEliteOrBoss = (this.stage.level % 5 === 4 || this.stage.level === ENEMY_DB.length - 1);
        if (this.player.relics.includes('firstaid') && isEliteOrBoss && this.player.hp < 3) {
            this.player.hp++;
        }

        if (this.stage.activeShackle === 'wither' && this.stage.shackleMeta && this.stage.shackleMeta.originalHp) {
            this.player.hp = this.stage.shackleMeta.originalHp;
        }

        if (this.stage.activeShackle === 'assimilation' && this.player.gold > 50) {
            this.player.gold = 0;
        }

        let baseEarn = 15;
        let turnsBonus = (this.stage.turnsLeft - 1) * 10;
        let extraEarn = 0;

        if (this.player.relics.includes('piggybank')) extraEarn += 5;
        let enemy = getEnemy(this.stage.level);
        if (this.player.relics.includes('bounty') && this.stage.turnsLeft === enemy.turns) extraEarn += 20;
        if (this.stage.activeShackle === 'pickyeater') baseEarn = Math.floor(baseEarn * 0.7);

        let activeRelics = this.player.relics;
        if (this.stage.activeShackle === 'relicseal' && this.stage.shackleMeta && this.stage.shackleMeta.ignoredRelics) {
            activeRelics = this.player.relics.filter(r => !this.stage.shackleMeta.ignoredRelics.includes(r));
        }

        if (activeRelics.includes('coin')) extraEarn += 15;
        if (activeRelics.includes('investor')) extraEarn += Math.floor(this.player.gold / 10);

        let earn = baseEarn + extraEarn + turnsBonus;
        this.player.gold += earn;

        this.openShop();
    }

    openShop() {
        let available = RELIC_DB.filter(r => !this.player.relics.includes(r.id)).sort(() => 0.5 - Math.random());
        let shopItems = available.slice(0, 3);

        if (this.stage.activeShackle === 'inflation') {
            shopItems = shopItems.map(i => ({...i, price: Math.ceil(i.price * 1.2)}));
        }
        if (this.player.relics.includes('vip')) {
            shopItems = shopItems.map(i => ({...i, price: Math.floor(i.price * 0.8)}));
        }

        for (let r of shopItems) {
            if (this.player.gold >= r.price) {
                this.player.gold -= r.price;
                this.player.relics.push(r.id);
            }
        }
    }
}

const TOTAL_RUNS = 100000;
let agg = { crashes: 0, wins: 0, shackleDeaths: {}, relicWins: {}, relicPicks: {}, handStats: {} };

console.log(`Starting simulation batch of ${TOTAL_RUNS} runs...`);

for (let i = 0; i < TOTAL_RUNS; i++) {
    let sim = new GameSimulation();
    let result = sim.run();

    if (result.error) {
        agg.crashes++;
        continue;
    }

    if (result.win) agg.wins++;

    if (result.shacklesDiedTo) {
        agg.shackleDeaths[result.shacklesDiedTo] = (agg.shackleDeaths[result.shacklesDiedTo] || 0) + 1;
    }

    for (let r of result.relicsPicked) {
        agg.relicPicks[r] = (agg.relicPicks[r] || 0) + 1;
        if (result.win) {
            agg.relicWins[r] = (agg.relicWins[r] || 0) + 1;
        }
    }

    for (let h in result.handsTriggered) {
        if (!agg.handStats[h]) agg.handStats[h] = { count: 0, totalDamage: 0 };
        agg.handStats[h].count += result.handsTriggered[h].count;
        agg.handStats[h].totalDamage += result.handsTriggered[h].totalDamage;
    }
}

let report = `===== BIBBIDIBA V4 SIMULATION REPORT (Full 100k simulation, all mechanics active) =====\n`;
let realRuns = TOTAL_RUNS;
report += `Total Runs Simulated: ${realRuns}\n`;
report += `Crashes: ${agg.crashes}\n`;
report += `Win Rate (Beat Stage 5): ${((agg.wins / TOTAL_RUNS) * 100).toFixed(2)}%\n\n`;

report += `===== SHACKLE DEATH RATES (Top 10) =====\n`;
let sortedShackles = Object.entries(agg.shackleDeaths).sort((a,b) => b[1] - a[1]).slice(0, 10);
for (let [s, count] of sortedShackles) {
    let shackleName = SHACKLE_DB.find(x => x.id === s)?.name || s;
    report += `${shackleName}: ${count} deaths\n`;
}

report += `\n===== RELIC PICK VS WIN RATE (Top 15 Win Rates with >1000 picks) =====\n`;
let relicStats = [];
for (let r in agg.relicPicks) {
    if (agg.relicPicks[r] > 1000) {
        let wr = (agg.relicWins[r] || 0) / agg.relicPicks[r];
        relicStats.push({ id: r, winRate: wr, picks: agg.relicPicks[r] });
    }
}
relicStats.sort((a,b) => b.winRate - a.winRate).slice(0, 15).forEach(rs => {
    let relicName = RELIC_DB.find(x => x.id === rs.id)?.name || rs.id;
    report += `${relicName} - Picked: ${rs.picks}, Win Rate: ${(rs.winRate * 100).toFixed(2)}%\n`;
});

report += `\n===== HANDS TRIGGERED & AVG DAMAGE =====\n`;
let sortedHands = Object.entries(agg.handStats).sort((a,b) => b[1].count - a[1].count);
for (let [h, stat] of sortedHands) {
    let avg = stat.totalDamage / stat.count;
    report += `${h} - Played: ${stat.count}, Avg Damage: ${avg.toFixed(2)}\n`;
}

fs.writeFileSync('v4_test_report.txt', report);
console.log(`Simulation complete.`);
