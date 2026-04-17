global.window = {};
global.document = {
    getElementById: () => null,
    createElement: () => ({ className: '', style: {}, appendChild: () => {}, remove: () => {} }),
    body: { appendChild: () => {} }
};
global.DOMParser = class {
    parseFromString(msg) {
        return {
            querySelectorAll: () => ({ forEach: () => {} }),
            body: { innerHTML: msg }
        };
    }
};

import('./js/ui.js').then((ui) => {
    console.log("Mock import successful!");
    ui.showToast("Test message", () => {});
    console.log("showToast executed without error in mock.");
}).catch(console.error);
global.Node = class {};
