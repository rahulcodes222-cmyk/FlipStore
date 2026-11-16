"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SellerTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface SellerTableProps<T> {
  columns: SellerTableColumn[];
  data: T[];
  loading?: boolean;
  onRowSelect?: (id: string, checked: boolean) => void;
  selectedIds: Set<string>;
  selectAll?: boolean;
  onSelectAll?: (checked: boolean) => void;
  getRowId: (row: T) => string;
  className?: string;
  emptyMessage?: string;
  renderRowActions?: (row: T) => React.ReactNode;
}

export function SellerTable<T>({
  columns,
  data,
  loading = false,
  onRowSelect,
  selectedIds,
  selectAll = false,
  onSelectAll,
  getRowId,
  className,
  emptyMessage = "No records found.",
  renderRowActions,
}: SellerTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = (a as any)[sortConfig.key];
    const bVal = (b as any)[sortConfig.key];
    if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
    sortedData.forEach((row) => {
      const id = getRowId(row);
      if (checked) selectedIds.add(id);
      else selectedIds.delete(id);
    });
    if (onRowSelect) {
      sortedData.forEach((row) => onRowSelect(getRowId(row), checked));
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) selectedIds.add(id);
    else selectedIds.delete(id);
    onRowSelect?.(id, checked);
  };

  if (loading) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm", className)}>
        <div className="h-40 rounded-sm bg-[#E8E8E8] animate-skeleton" />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-8 shadow-sm", className)}>
        <div className="text-center">
          <p className="text-sm text-[#878787]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const isSelectAllChecked = sortedData.length > 0 && sortedData.every((row) => selectedIds.has(getRowId(row)));
  const isIndeterminate =
    sortedData.length > 0 &&
    !isSelectAllChecked &&
    sortedData.some((row) => selectedIds.has(getRowId(row)));

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
            <tr>
              {onRowSelect && (
                <th className="px-4 py-3">
                  <Checkbox
                    checked={selectAll || isSelectAllChecked}
                    onCheckedChange={handleSelectAll}
                    indeterminate={isIndeterminate}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase tracking-wider cursor-pointer select-none hover:bg-[#F1F3F6]",
                    col.sortable && "hover:text-[#2874F0]",
                    col.width && `w-[${col.width}]`
                  )}
                  onClick={col.sortable ? () => setSortConfig((prev) => (prev?.key === col.key && prev.dir === "asc" ? { key: col.key, dir: "desc" } : { key: col.key, dir: "asc" })) : undefined}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ml-1 text-[10px]">
                      {sortConfig?.key === col.key ? (sortConfig.dir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  )}
                </th>
              ))}
              {renderRowActions && <th className="px-4 py-3 w-24" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {sortedData.map((row) => {
              const id = getRowId(row);
              const isSelected = selectedIds.has(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    "hover:bg-[#F1F3F6] transition-colors",
                    isSelected && "bg-[#2874F0]/5"
                  )}
                >
                  {onRowSelect && (
                    <td className="px-4 py-3">
                      <Checkbox checked={isSelected} onCheckedChange={(checked) => handleRowSelect(id, checked)} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                    </td>
                  ))}
                  {renderRowActions && <td className="px-4 py-3">{renderRowActions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
