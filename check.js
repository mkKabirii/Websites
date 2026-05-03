const fs = require('fs');
const path = require('path');

const validationPath = path.join(__dirname, 'wgtech-backend/utils/validation.js');
let validationContent = fs.readFileSync(validationPath, 'utf8');

console.log("Lines 185-195:");
console.log(validationContent.split('\n').slice(185, 195).join('\n'));

console.log("\nLines 205-215:");
console.log(validationContent.split('\n').slice(205, 215).join('\n'));
