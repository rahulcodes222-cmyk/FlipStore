const fs = require("fs");
const path = require("path");

// Fix add page
const addPage = path.join("src", "app", "seller", "(dashboard)", "products", "add", "page.tsx");
let c = fs.readFileSync(addPage, "utf8");
c = c.replace(/\\\\n/g, "\n");
c = c.replace(/isFreeDelivery: z\.boolean\(\)\.optional\(\),\n\};/, "isFreeDelivery: z.boolean().optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});");
fs.writeFileSync(addPage, c, "utf8");
console.log("add page fixed");

// Fix edit page
const editPage = path.join("src", "app", "seller", "(dashboard)", "products", "[id]", "edit", "page.tsx");
let e = fs.readFileSync(editPage, "utf8");
e = e.replace(/estimatedDeliveryDays: z\.coerce\.number\(\)\.int\(\)\.min\(0\)\.max\(30\)\.optional\(\),\n\};/, "estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});");
fs.writeFileSync(editPage, e, "utf8");
console.log("edit page fixed");
