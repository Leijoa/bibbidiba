const fs = require('fs');
let content = fs.readFileSync('js/i18n.js', 'utf8');

content = content.replace(/export const i18n = new I18nManager\(\);/g, "export const i18n = new I18nManager();\nif (typeof window !== 'undefined') window.i18n = i18n;");
fs.writeFileSync('js/i18n.js', content);
console.log('done');
