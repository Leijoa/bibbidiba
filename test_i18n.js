global.localStorage = { getItem: () => 'zh-tw', setItem: () => {} };
global.window = { getStageActiveShackle: () => null };
global.document = { querySelectorAll: () => [] };

const MockElement = class {
  constructor() {
    this.classList = { add: () => {}, remove: () => {}, contains: () => false };
    this.innerHTML = '';
    this.innerText = '';
    this.className = '';
    this.style = {};
  }
  setAttribute() {}
};

global.document.getElementById = (id) => new MockElement();
global.document.createElement = () => new MockElement();
global.Node = class Node {};

import('./js/ui.js').then((ui) => {
    ui.el.enemyName = new MockElement();
    ui.el.enemyHpBar = new MockElement();
    ui.el.enemyHpText = new MockElement();
    ui.el.playerHp = new MockElement();
    ui.updateEnemyUI({ level: 0, enemyHp: 1500, enemyMaxHp: 1500, playerHp: 3, maxHp: 3 });
    console.log("Enemy 0 rendering test:", ui.el.enemyName.innerHTML);

    ui.updateEnemyUI({ level: 12, enemyHp: 1500, enemyMaxHp: 1500, playerHp: 3, maxHp: 3 });
    console.log("Enemy 12 rendering test:", ui.el.enemyName.innerHTML);
});
