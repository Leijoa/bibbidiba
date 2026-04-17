import { calculateEngineScore } from './js/engine.js';
import { RELIC_DB } from './js/data.js';

function rollDice() {
    return Array.from({length: 8}, () => ({val: Math.floor(Math.random() * 8) + 1}));
}

function runSimulation(iterations, relics = []) {
    let totalScore = 0;

    for (let i = 0; i < iterations; i++) {
        let dice = rollDice();
        // Calculate the score specifically for "allin" test to be correct since default hp is 3, making it 1 here
        let playerHp = relics.includes('allin') ? 1 : 3;
        let result = calculateEngineScore(dice, relics, 0, playerHp);
        totalScore += result.finalScore;
    }

    return totalScore / iterations;
}

console.log("Running baseline simulation...");
let baselineAvg = runSimulation(100000);

// Relic testing
console.log("\nTesting Relic Effects...");
RELIC_DB.forEach(relic => {
    if (relic.id !== 'coin' && relic.id !== 'investor' && relic.id !== 'refresh' && relic.id !== 'goldendice') { // Skip non-score relics for now
        let simAvg = runSimulation(100000, [relic.id]);
        console.log(`${relic.name}: Avg = ${simAvg.toFixed(2)}, Multiplier = ${(simAvg / baselineAvg).toFixed(2)}x`);
    }
});
