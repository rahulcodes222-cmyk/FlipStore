import React from "react";

interface ProductSpecsTableProps {
  specifications?: Record<string, Record<string, string>>;
  brand?: string;
}

export function ProductSpecsTable({
  specifications = {},
  brand,
}: ProductSpecsTableProps) {
  const categories = Object.entries(specifications);

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
          {categories.map(([groupTitle, specs]) => (
            <div key={groupTitle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2874F0] mb-2.5">
                {groupTitle}
              </h3>
              <div className="border border-[#F0F0F0] rounded-xs overflow-hidden divide-y divide-[#F0F0F0] text-xs sm:text-sm">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 p-3">
                    <span className="text-[#878787] font-medium sm:col-span-1">{key}</span>
                    <span className="text-[#212121] sm:col-span-2 mt-0.5 sm:mt-0 font-normal">
                      {value}
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
