const fs = require('fs');
const path = require('path');

// 1. Patch validation.js
const validationPath = path.join(__dirname, 'wgtech-backend/utils/validation.js');
let validationContent = fs.readFileSync(validationPath, 'utf8');

// For createWorkSchema
validationContent = validationContent.replace(
  /purpose: Joi\.string\(\)\.required\(\),?\s*\}\),/g,
  `purpose: Joi.string().required(),\n        status: Joi.string().valid("Active", "Inactive", "active", "inactive").default("Active"),\n      }),`
);

// For updateWorkSchema
validationContent = validationContent.replace(
  /description: Joi\.string\(\)\.required\(\),?\s*\}\),/g,
  `description: Joi.string().required(),\n        status: Joi.string().valid("Active", "Inactive", "active", "inactive").optional(),\n      }),`
);

fs.writeFileSync(validationPath, validationContent);

console.log("Patched validation.js successfully!");
