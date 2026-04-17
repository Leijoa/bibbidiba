import { calculateEngineScore } from './js/engine.js';
// Strict 4 pairs: 2,2,2,2 of diff numbers
let strictDice = [{val:1},{val:1},{val:2},{val:2},{val:3},{val:3},{val:4},{val:4}];
// Not strict 4 pairs, but has 4 pairs (e.g. from 3 of a kind and 5 of a kind) -> wait, 3 and 5 is Hulu, which is higher
// Let's do 4,2,2
let luxuryDice = [{val:1},{val:1},{val:1},{val:1},{val:2},{val:2},{val:3},{val:3}];

console.log("Strict dice:", calculateEngineScore(strictDice, [], 0, 3).tagC.name);
console.log("Luxury dice:", calculateEngineScore(luxuryDice, [], 0, 3).tagC.name);
