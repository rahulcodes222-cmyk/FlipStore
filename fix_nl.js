const fs = require("fs");
const p = "src/app/seller\\(dashboard)\products\add\page.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.replace(/\\\\n/g, "\n");
fs.writeFileSync(p, c, "utf8");
console.log("nl fixed in add page");
