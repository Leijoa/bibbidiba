import { calculateEngineScore } from './js/engine.js';
import { RELIC_DB } from './js/data.js';

function rollDice() {
    return Array.from({length: 8}, () => ({val: Math.floor(Math.random() * 8) + 1}));
}

function runSimulation(iterations, relics = []) {
    let totalScore = 0;
    let maxScore = 0;
    let handCounts = {};

    for (let i = 0; i < iterations; i++) {
        let dice = rollDice();
        let result = calculateEngineScore(dice, relics, 0, 3); // 0 rolls left, 3 hp

        totalScore += result.finalScore;
        if (result.finalScore > maxScore) maxScore = result.finalScore;

        // Count tags
        let tags = [result.tagA.name, result.tagB.name, result.tagC.name, result.tagD.name];
        tags.forEach(tag => {
            if (tag !== '無') {
                handCounts[tag] = (handCounts[tag] || 0) + 1;
            }
        });
    }

    return {
        avgScore: totalScore / iterations,
        maxScore,
        handCounts
    };
}

console.log("Running baseline simulation...");
let baseline = runSimulation(100000);
console.log("Baseline Average Score:", baseline.avgScore);
console.log("Baseline Max Score:", baseline.maxScore);

// Convert hand counts to probabilities
let probabilities = {};
for (let tag in baseline.handCounts) {
    probabilities[tag] = (baseline.handCounts[tag] / 100000) * 100;
}

// Sort probabilities by frequency
let sortedProbs = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
console.log("\nHand Probabilities (%):");
sortedProbs.forEach(([tag, prob]) => {
    console.log(`${tag}: ${prob.toFixed(4)}%`);
});

// Relic testing
console.log("\nTesting Relic Effects...");
RELIC_DB.forEach(relic => {
    if (relic.id !== 'coin' && relic.id !== 'investor' && relic.id !== 'refresh' && relic.id !== 'goldendice') { // Skip non-score relics for now
        let sim = runSimulation(100000, [relic.id]);
        console.log(`${relic.name}: Avg = ${sim.avgScore.toFixed(2)}, Multiplier = ${(sim.avgScore / baseline.avgScore).toFixed(2)}x`);
    }
});
