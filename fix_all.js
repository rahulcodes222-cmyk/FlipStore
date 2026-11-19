const fs = require("fs");
const path = require("path");

// --- Add Page ---
const addPage = path.join("src", "app", "seller", "(dashboard)", "products", "add", "page.tsx");
let c = fs.readFileSync(addPage, "utf8");
c = c.replace(/\\\\n/g, "\n");
fs.writeFileSync(addPage, c, "utf8");
console.log("add page nl fixed");

// --- Edit Page ---
const editPage = path.join("src", "app", "seller", "(dashboard)", "products", "[id]", "edit", "page.tsx");
let e = fs.readFileSync(editPage, "utf8");

// Schema fields
e = e.replace(
  "estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),\n});",
  "estimatedDeliveryDays: z.coerce.number().int().min(0).max(30).optional(),\n  returnPolicy: z.string().max(2000).optional(),\n  returnWindowDays: z.coerce.number().int().min(0).max(365).optional(),\n  isReturnable: z.boolean().optional(),\n});"
);

// form.reset defaultValues
e = e.replace(
  "estimatedDeliveryDays: p.estimatedDeliveryDays ?? 5,\n          });",
  "estimatedDeliveryDays: p.estimatedDeliveryDays ?? 5,\n            returnPolicy: (p as any).returnPolicy || \"\",\n            returnWindowDays: (p as any).returnWindowDays ?? 7,\n            isReturnable: (p as any).isReturnable ?? true,\n          });"
);

// update payload
e = e.replace(
  "estimatedDeliveryDays: values.estimatedDeliveryDays ?? 5,\n      images: productImages,",
  "estimatedDeliveryDays: values.estimatedDeliveryDays ?? 5,\n      returnPolicy: values.returnPolicy || \"\",\n      returnWindowDays: Number(values.returnWindowDays ?? 7),\n      isReturnable: values.isReturnable ?? true,\n      images: productImages,"
);

fs.writeFileSync(editPage, e, "utf8");
console.log("edit page fixed");