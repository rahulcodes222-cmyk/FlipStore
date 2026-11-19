const fs = require("fs");
const p = "src/app/seller\\(dashboard)\products\add\page.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.replace(/\\\\n/g, "\n");
c = c.replace(/isFreeDelivery: z\.boolean\(\)\.optional\(\),\n\};/, "isFreeDelivery: z.boolean().optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});");
fs.writeFileSync(p, c, "utf8");
console.log("add page fixed");
