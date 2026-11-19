const fs = require("fs");
const path = require("path");

// --- Add Page ---
const addPage = path.join("src", "app", "seller", "(dashboard)", "products", "add", "page.tsx");
let c = fs.readFileSync(addPage, "utf8");

// 1) Fix literal \\n sequences anywhere
c = c.replace(/\\\\n/g, "\n");

// 2) Add schema fields after isFreeDelivery line
c = c.replace(/isFreeDelivery: z\.boolean\(\)\.optional\(\),\n\};/, "isFreeDelivery: z.boolean().optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});");

// 3) Add return policy fields to defaultValues after isFreeDelivery: false,
c = c.replace(/isFreeDelivery: false,\n    \},/, "isFreeDelivery: false,\n      returnPolicy: \"\",\n      returnWindowDays: 7,\n      isReturnable: true,\n    },");

// 4) Add return policy fields to create payload after estimatedDeliveryDays: ...,
c = c.replace(/estimatedDeliveryDays: Number\(values\.estimatedDeliveryDays \?\? 3\),\n      isFreeDelivery: !!values\.isFreeDelivery,\n    \};/, "estimatedDeliveryDays: Number(values.estimatedDeliveryDays ?? 3),\n      isFreeDelivery: !!values.isFreeDelivery,\n      returnPolicy: values.returnPolicy ?? \"\",\n      returnWindowDays: Number(values.returnWindowDays ?? 7),\n      isReturnable: values.isReturnable ?? true,\n    };");

fs.writeFileSync(addPage, c, "utf8");
console.log("add page fixed");

// --- Edit Page ---
const editPage = path.join("src", "app", "seller", "(dashboard)", "products", "[id]", "edit", "page.tsx");
let e = fs.readFileSync(editPage, "utf8");

// 1) Schema fields after estimatedDeliveryDays line
e = e.replace(/estimatedDeliveryDays: z\.coerce\.number\(\)\.int\(\)\.min\(0\)\.max\(30\)\.optional\(\),\n\};/, "estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});");

// 2) form.reset defaultValues
e = e.replace(/estimatedDeliveryDays: p\.estimatedDeliveryDays \?\? 5,\n          \});/, "estimatedDeliveryDays: p.estimatedDeliveryDays ?? 5,\n            returnPolicy: (p as any).returnPolicy || \"\",\n            returnWindowDays: (p as any).returnWindowDays ?? 7,\n            isReturnable: (p as any).isReturnable ?? true,\n          });");

// 3) update payload after estimatedDeliveryDays line
e = e.replace(/estimatedDeliveryDays: values\.estimatedDeliveryDays \?\? 5,\n      images: productImages,/, "estimatedDeliveryDays: values.estimatedDeliveryDays ?? 5,\n      returnPolicy: values.returnPolicy ?? \"\",\n      returnWindowDays: Number(values.returnWindowDays ?? 7),\n      isReturnable: values.isReturnable ?? true,\n      images: productImages,");

fs.writeFileSync(editPage, e, "utf8");
console.log("edit page fixed");
