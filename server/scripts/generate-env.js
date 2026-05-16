const fs = require("fs");
const crypto = require("crypto");

const jwtSecret = crypto.randomBytes(32).toString("hex");

const envContent = `
JWT_SECRET=${jwtSecret}
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=labguard
`.trim();

fs.writeFileSync(".env", envContent);

console.log(".env file created successfully");