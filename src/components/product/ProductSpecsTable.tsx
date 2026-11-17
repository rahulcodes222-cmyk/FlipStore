import React from "react";

interface ProductSpecsTableProps {
  specifications?: any;
  brand?: string;
}

function toDisplayValue(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(toDisplayValue).filter(Boolean).join(", ");
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeSpecs(input: any): Array<{ title: string; rows: Array<{ key: string; value: string }> }> {
  if (!input) return [];

  const groups: Array<{ title: string; rows: Array<{ key: string; value: string }> }> = [];
  const pushGroup = (title: string, rows: Array<{ key: string; value: string }>) => {
    const filtered = rows.filter((r) => r.key && r.value !== "");
    if (filtered.length) groups.push({ title: title || "General", rows: filtered });
  };

  if (Array.isArray(input)) {
    const rows = input
      .map((item: any, idx: number) => {
        if (!isPlainObject(item)) return null;
        const key = String(item.key ?? item.label ?? item.name ?? item.title ?? "").trim();
        const value = toDisplayValue(item.value ?? item.val ?? item.detail ?? item.description);
        if (!key || !value) return null;
        return { key, value };
      })
      .filter(Boolean) as Array<{ key: string; value: string }>;
    pushGroup("General", rows);
    return groups;
  }

  if (!isPlainObject(input)) return [];

  const entries = Object.entries(input);
  if (entries.length === 0) return [];

  // Detect grouped shape: { "General": { "Brand": "Samsung" } }
  const values = entries.map(([, v]) => v);
  const groupedShape = values.some((v) => isPlainObject(v));

  if (groupedShape) {
    const generalRows: Array<{ key: string; value: string }> = [];
    for (const [k, v] of entries) {
      if (isPlainObject(v)) {
        const rows = Object.entries(v).map(([rk, rv]) => ({ key: String(rk).trim(), value: toDisplayValue(rv) }));
        pushGroup(k, rows);
      } else {
        const value = toDisplayValue(v);
        if (value) generalRows.push({ key: String(k).trim(), value });
      }
    }
    if (generalRows.length) groups.unshift({ title: "General", rows: generalRows });
    return groups;
  }

  // Flat shape: { "Brand": "Samsung" }
  const rows = entries.map(([k, v]) => ({ key: String(k).trim(), value: toDisplayValue(v) }));
  pushGroup("General", rows);
  return groups;
}

export function ProductSpecsTable({
  specifications = {},
  brand,
}: ProductSpecsTableProps) {
  const categories = React.useMemo(() => normalizeSpecs(specifications), [specifications]);

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-6 shadow-2xs space-y-6">
      <div className="pb-3 border-b border-[#F0F0F0]">
        <h2 className="text-base sm:text-lg font-bold text-[#212121]">
          Specifications &amp; Technical Details
        </h2>
        {brand && (
          <p className="text-xs text-[#878787] mt-0.5">
            Original manufactured product by {brand}
          </p>
        )}
      </div>

      {categories.length > 0 ? (
        <div className="space-y-6">
          {categories.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2874F0] mb-2.5">
                {group.title}
              </h3>
              <div className="border border-[#F0F0F0] rounded-xs overflow-hidden divide-y divide-[#F0F0F0] text-xs sm:text-sm">
                {group.rows.map((row) => (
                  <div key={`${group.title}-${row.key}`} className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-0">
                    <span className="text-[#878787] font-medium sm:col-span-1 break-words">{row.key}</span>
                    <span className="text-[#212121] sm:col-span-2 mt-0.5 sm:mt-0 font-normal break-words whitespace-pre-wrap">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#878787]">
          Detailed specifications will be updated soon by the brand.
        </p>
      )}
    </div>
  );
}
