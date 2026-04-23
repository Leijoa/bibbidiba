const fs = require('fs');

let code = fs.readFileSync('js/main.js', 'utf8');

// The issue is that player.berserkerBonus is being incremented when 'berserker' triggers,
// but it is not being added to baseMaxRolls in startTurn().

let toReplace = `    let baseMaxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2);
    if (stage.activeShackle === 'fatigue') {
        baseMaxRolls = Math.max(0, baseMaxRolls - 1);
    }
    if (stage.activeShackle === 'destinychain') {
        baseMaxRolls = 1;
    }`;

let replacement = `    let baseMaxRolls = 2 + (player.relics.filter(id => id === 'refresh').length * 2) + (player.berserkerBonus || 0);
    if (stage.activeShackle === 'fatigue') {
        baseMaxRolls = Math.max(0, baseMaxRolls - 1);
    }
    if (stage.activeShackle === 'destinychain') {
        baseMaxRolls = 1;
    }`;

if(code.includes(toReplace)) {
    code = code.replace(toReplace, replacement);
    fs.writeFileSync('js/main.js', code);
    console.log("Patched berserkerBonus into baseMaxRolls");
} else {
    console.log("Could not find exact baseMaxRolls calc");
}
