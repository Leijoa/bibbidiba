import { calculateEngineScore } from './js/engine.js';
let dice = [{val:1},{val:2},{val:3},{val:4},{val:5},{val:6},{val:7},{val:8}];

console.log("No relics:", calculateEngineScore(dice, [], 0, 3).totalBase);
console.log("small:", calculateEngineScore(dice, ['small'], 0, 3).totalBase);
console.log("mid:", calculateEngineScore(dice, ['mid'], 0, 3).totalBase);
console.log("big:", calculateEngineScore(dice, ['big'], 0, 3).totalBase);
console.log("odd:", calculateEngineScore(dice, ['odd'], 0, 3).totalBase);
console.log("even:", calculateEngineScore(dice, ['even'], 0, 3).totalBase);
