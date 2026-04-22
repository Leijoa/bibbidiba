import { calculateEngineScore } from './js/engine.js';

// Helper to create dice
const cd = vals => vals.map(v => ({ val: v, locked: false, id: Math.random() }));

let dice, res;

console.log("=== Testing blackhole ===");
dice = cd([8, 8, 8, 8, 2, 3, 4, 5]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'blackhole' });
console.log("Blackhole A name:", res.tagA.name); // Should be 四同 (because 8s become 1s)
console.log("Blackhole Notes:", res.globalNotes);

console.log("\n=== Testing parityfear ===");
dice = cd([2, 4, 6, 8, 1, 3, 5, 7]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'parityfear', fearType: 'even' });
console.log("Fear Even Base:", res.totalBase); // Odd points should be counted, even points 0

console.log("\n=== Testing numberplunder ===");
dice = cd([7, 7, 7, 7, 7, 7, 7, 7]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'numberplunder', targetNumber: 7 });
console.log("Plunder 7 A name:", res.tagA.name); // Should be 無
console.log("Plunder 7 TotalBase:", res.totalBase); // Should be 0

console.log("\n=== Testing ordercollapse ===");
dice = cd([1, 2, 3, 4, 5, 6, 7, 8]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'ordercollapse' });
console.log("OrderCollapse B name:", res.tagB.name); // Should be 無

console.log("\n=== Testing chaoslaw ===");
dice = cd([8, 8, 8, 8, 8, 8, 8, 8]);
res = calculateEngineScore(dice, [], 0, 3, { id: 'chaoslaw' });
console.log("ChaosLaw A name:", res.tagA.name); // Should be 無 (was B)
console.log("ChaosLaw B name:", res.tagB.name); // Should be 八重奏 (was A)
