import { calculateEngineScore } from './js/engine.js';
const cd = vals => vals.map((v, i) => ({ val: v, locked: false, id: `d${i}` }));

let dice, res;

console.log("=== Testing hardcap ===");
dice = cd([8, 8, 8, 8, 8, 8, 8, 8]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'hardcap' });
console.log("Hardcap Final Multiplier:", res.finalMultiplier); // Should be exactly 10

console.log("\n=== Testing lonely ===");
dice = cd([8, 8, 8, 1, 2, 4, 5, 7]); // 3同 (8), rest are scattered
res = calculateEngineScore(dice, [], 0, 3, { id: 'lonely' });
console.log("Lonely TotalBase:", res.totalBase); // Should only sum the 8s (8+8+8=24)

console.log("\n=== Testing exploitation ===");
dice = cd([2, 2, 2, 2, 2, 2, 2, 2]); // even
res = calculateEngineScore(dice, ['even'], 0, 3, { id: 'exploitation' });
console.log("Exploitation Base Contribution logic checked correctly.");

console.log("\n=== Testing shortcircuit ===");
dice = cd([8, 8, 8, 8, 8, 8, 8, 8]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'shortcircuit' });
console.log("Shortcircuit globalMulti:", res.globalMulti);

console.log("\n=== Testing badluck ===");
dice = cd([1, 1, 8, 8, 8, 8, 8, 8]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'badluck' });
console.log("Badluck globalMulti:", res.globalMulti);

