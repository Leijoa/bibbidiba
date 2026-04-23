import fs from 'fs';
import { calculateEngineScore } from '../js/engine.js';
import { RELIC_DB, ENEMY_DB, SHACKLE_DB, getEnemy } from '../js/data.js';

function assignShackleForStage(levelIndex, playerRelics) {
    let shackleType = null;
    if (levelIndex < ENEMY_DB.length) {
        if (levelIndex === 2) shackleType = 'light';
        else if (levelIndex === 4) shackleType = 'heavy';
    } else {
        return { id: null, meta: null }; // no shackles in inf for fast testing
    }

    if (shackleType) {
        let candidates = SHACKLE_DB.filter(s => s.type === shackleType);
        let selected = candidates[Math.floor(Math.random() * candidates.length)];
        return { id: selected.id, meta: null };
    }
    return { id: null, meta: null };
}

class GameSimulation {
    constructor() {
        const strategies = ['pairs', 'straights', 'mixed'];
        const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
        this.player = { hp: 3, gold: 20, relics: [], maxRolls: 2, isInfiniteMode: false, strategy: selectedStrategy };
        this.stage = { level: 0, enemyHp: 0, enemyMaxHp: 0, turnsLeft: 0, activeShackle: null, shackleMeta: null };
        this.battle = { dice: [], rollsLeft: 0, scoreResult: null };
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
                // To win, we need to beat stage 4
                if (this.stage.level > 4) {
                    this.metrics.win = true;
                    break;
                }
                this.loadStage(this.stage.level);
                let result = this.playStage();
                if (result === 'playerDied') {
                    break;
                } else if (result === 'win') {
                    if (this.stage.level === 4) {
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
                if (this.player.hp <= 0) {
                    if (this.stage.activeShackle) this.metrics.shacklesDiedTo = this.stage.activeShackle;
                    return 'playerDied';
                } else {
                    let enemy = getEnemy(this.stage.level);
                    this.stage.turnsLeft = enemy.turns;
                }
            }
        }
        if (turnLimit <= 0) this.player.hp = 0;
        if (this.player.hp <= 0 && this.stage.activeShackle) this.metrics.shacklesDiedTo = this.stage.activeShackle;
        return this.player.hp > 0 ? 'win' : 'playerDied';
    }

    startTurn() {
        this.player.maxRolls = 2;
        if(this.player.relics.includes('refresh')) this.player.maxRolls += 2;
        this.battle.rollsLeft = this.player.maxRolls;
        this.battle.dice = Array(8).fill().map((_, i) => ({ val: 1, locked: false, id: i }));
        this.executeRoll(true);
    }

    executeRoll(isInitial = false) {
        if (!isInitial) {
            this.battle.rollsLeft--;
        }

        this.battle.dice = this.battle.dice.map(d => d.locked ? d : { ...d, val: Math.floor(Math.random() * 8) + 1 });
        this.battle.dice.sort((a, b) => a.val - b.val);

        this.calculateCurrentScore(isInitial);
        return true;
    }

    calculateCurrentScore(isInitialRoll) {
        let shackleConfig = null;
        if (this.stage.activeShackle) {
            shackleConfig = { id: this.stage.activeShackle };
        }

        this.battle.scoreResult = calculateEngineScore(
            this.battle.dice,
            this.player.relics,
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

        if (this.player.strategy === 'straights') {
            let lockedVals = new Set();
            this.battle.dice.forEach(d => {
                if (!lockedVals.has(d.val)) {
                    d.locked = true;
                    lockedVals.add(d.val);
                } else {
                    d.locked = false;
                }
            });
        } else if (this.player.strategy === 'pairs') {
            let counts = Array(9).fill(0);
            this.battle.dice.forEach(d => counts[d.val]++);

            this.battle.dice.forEach(d => {
                let willLock = false;
                if (counts[d.val] >= 2) willLock = true;
                else if (d.val >= 6) willLock = true;
                d.locked = willLock;
            });
        } else {
            // Mixed strategy: randomize per turn or just lock 6,7,8
            this.battle.dice.forEach(d => {
                d.locked = d.val >= 6;
            });
        }
    }

    fireAttack() {
        let dmg = Math.floor(this.battle.scoreResult.finalScore);
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

        return dmg;
    }

    enemyDefeated() {
        let baseEarn = 15 + ((this.stage.turnsLeft - 1) * 10);
        this.player.gold += baseEarn;
        this.openShop();
    }

    openShop() {
        let available = RELIC_DB.filter(r => !this.player.relics.includes(r.id)).sort(() => 0.5 - Math.random());
        let shopItems = available.slice(0, 3);

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

// Extrapolate to 100k
let report = `===== BIBBIDIBA V4 SIMULATION REPORT (100k runs extrapolated from full 100k simulation) =====\n`;
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
    if (agg.relicPicks[r] > 10) {
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
