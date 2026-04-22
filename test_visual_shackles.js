// Mock globals
global.window = {
    getStageActiveShackle: () => 'dizziness',
    getShackleMeta: () => ({ displayOrder: [7, 6, 5, 4, 3, 2, 1, 0] })
};

global.document = {
    getElementById: () => ({ innerHTML: '' })
};

import { renderDice, el } from './js/ui.js';

el.diceContainer = { innerHTML: '' };
el.rollsBadge = { innerText: '', className: '' };

let battle = {
    state: 'WAIT_ACTION',
    dice: Array(8).fill().map((_, i) => ({ val: i+1, locked: false, id: i, matchedGroups: {A:false, B:false, C:false, D:false} })),
    rollsLeft: 1
};

renderDice(battle, null);
console.log("Dizziness applied order style:", el.diceContainer.innerHTML.includes('style="order: 7;"'));

global.window.getStageActiveShackle = () => 'blind';
global.window.getShackleMeta = () => ({ blindIndices: [0, 1] });

renderDice(battle, null);
console.log("Blind applied '?' mask:", el.diceContainer.innerHTML.includes('>?</span>'));

global.window.getStageActiveShackle = () => 'illusion';
global.window.getShackleMeta = () => ({ fakeNumber: 5 });

renderDice(battle, null);
console.log("Illusion applied fake number mask:", el.diceContainer.innerHTML.match(/>5<\/span>/g).length > 1);

global.window.getStageActiveShackle = () => 'inversion';
global.window.getShackleMeta = () => ({ colorMap: ['bg-red-600', 'bg-blue-600', 'bg-red-600', 'bg-blue-600', 'bg-red-600', 'bg-blue-600', 'bg-red-600', 'bg-blue-600'] });

renderDice(battle, null);
console.log("Inversion applied randomized color:", el.diceContainer.innerHTML.includes('bg-red-600') && el.diceContainer.innerHTML.includes('text-slate-900'));
